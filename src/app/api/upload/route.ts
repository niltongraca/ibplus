import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_EXTENSIONS: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

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

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ficheiro demasiado grande (máx. 5MB)." }, { status: 400 });
    }

    const extMatch = file.name.match(/\.([A-Za-z0-9]+)$/);
    const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : "";
    const allowedType = ALLOWED_EXTENSIONS[ext];

    if (!allowedType) {
      return NextResponse.json({ error: "Tipo de ficheiro não permitido." }, { status: 400 });
    }

    if (file.type && file.type !== allowedType) {
      return NextResponse.json({ error: "Tipo de ficheiro inválido." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!buffer.length) {
      return NextResponse.json({ error: "Ficheiro vazio." }, { status: 400 });
    }

    const mime = file.type || allowedType;
    const url = `data:${mime};base64,${buffer.toString("base64")}`;

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Erro ao fazer upload." }, { status: 500 });
  }
}