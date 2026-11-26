import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { requireFeature } from "@/lib/permissions";
import { isDataUrl, PROOF_EXTENSIONS } from "@/lib/upload";

const ALLOWED_MIMES = new Set(Object.values(PROOF_EXTENSIONS));
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

function safeFileName(name: string | null): string {
  return (name ?? "comprovativo")
    .replace(/[^A-Za-z0-9._-]/g, "")
    .replace(/\.{2,}/g, ".") || "comprovativo";
}

/**
 * Comprovativos novos são Blobs privados e exigem token para leitura. O fetch
 * directo é apenas compatibilidade com os Blobs públicos gravados antes desta
 * alteração (e com data-URLs legadas, tratadas no chamador).
 */
async function fetchStoredProof(url: string): Promise<Uint8Array> {
  if (BLOB_TOKEN) {
    try {
      const result = await get(url, { access: "private", token: BLOB_TOKEN });
      if (result?.statusCode === 200 && result.stream) {
        return new Uint8Array(await new Response(result.stream).arrayBuffer());
      }
    } catch {
      // Tenta o URL público legado abaixo.
    }
  }

  const remote = await fetch(url);
  if (!remote.ok) throw new Error("Comprovativo indisponível.");
  return new Uint8Array(await remote.arrayBuffer());
}

/** Serve o comprovativo apenas ao organizador autenticado do evento. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
) {
  try {
    const { id, registrationId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
    const denied = await requireFeature(user, "eventos");
    if (denied) return denied;

    const event = await prisma.event.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true },
    });
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    const registration = await prisma.eventRegistration.findFirst({
      where: { id: registrationId, eventId: event.id },
      select: { proofUrl: true, proofMime: true, proofName: true },
    });
    if (!registration) {
      return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
    }
    if (!ALLOWED_MIMES.has(registration.proofMime)) {
      return NextResponse.json({ error: "Formato de comprovativo inválido." }, { status: 415 });
    }

    let bytes: Uint8Array;
    if (isDataUrl(registration.proofUrl)) {
      const match = /^data:([^;,]+);base64,([\s\S]*)$/.exec(registration.proofUrl);
      if (!match || match[1] !== registration.proofMime) {
        return NextResponse.json({ error: "Comprovativo inválido." }, { status: 415 });
      }
      bytes = Buffer.from(match[2], "base64");
    } else {
      try {
        bytes = await fetchStoredProof(registration.proofUrl);
      } catch {
        return NextResponse.json({ error: "Comprovativo indisponível." }, { status: 502 });
      }
    }

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": registration.proofMime,
        "Content-Disposition": `inline; filename="${safeFileName(registration.proofName)}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Erro ao abrir comprovativo." }, { status: 500 });
  }
}
