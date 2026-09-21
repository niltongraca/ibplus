import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAuthUser } from "@/lib/auth";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { resolveUpload, buildInlineDataUrl } from "@/lib/upload";

/**
 * POST /api/upload — armazena imagens no Vercel Blob (auditoria #18 — follow-up).
 * Sem BLOB_READ_WRITE_TOKEN configurado cai para o formato legado (data-URL
 * base64 em BD) para não quebrar uploads; com token, devolve URL pública do Blob.
 * Contrato de resposta inalterado: { url }.
 */

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

function sanitizeFileName(name: string): string {
  const clean = name.replace(/[^A-Za-z0-9._-]/g, "").replace(/\.{2,}/g, ".");
  return clean || `upload-${Date.now()}`;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const check = await checkRateLimit(`upload:${ip}`, "medium");
  if (!check.allowed) return rateLimitResponse(check.retryAfter!);

  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Nenhum ficheiro enviado." }, { status: 400 });

    const resolved = resolveUpload({ name: file.name, size: file.size, type: file.type });
    if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!buffer.length) return NextResponse.json({ error: "Ficheiro vazio." }, { status: 400 });

    let url: string;
    let storage: "blob" | "inline" = "inline";

    if (BLOB_TOKEN) {
      try {
        const path = `uploads/${Date.now()}-${sanitizeFileName(file.name)}`;
        const blob = await put(path, buffer, {
          access: "public",
          contentType: resolved.mime,
          token: BLOB_TOKEN,
          addRandomSuffix: true,
        });
        url = blob.url;
        storage = "blob";
      } catch (err) {
        // Blob indisponível/falha → mantém o comportamento legado para não
        // quebrar uploads (ver runbook na doc da auditoria #18).
        console.error("[upload] falha no Vercel Blob, a usar data-URL:", err);
        url = buildInlineDataUrl(resolved.mime, buffer);
      }
    } else {
      // Sem token: formatação legada (data-URL). Adicionar o token na env
      // ativa o armazenamento em Blob — ver docs/auditoria-2026-09.md (#18).
      url = buildInlineDataUrl(resolved.mime, buffer);
    }

    return NextResponse.json({ url, storage });
  } catch {
    return NextResponse.json({ error: "Erro ao fazer upload." }, { status: 500 });
  }
}