import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Nenhum ficheiro enviado." }, { status: 400 });

    const ext = file.name.split(".").pop() || "png";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, fileName), buffer);

    return NextResponse.json({ url: `/uploads/${fileName}` });
  } catch {
    return NextResponse.json({ error: "Erro ao fazer upload." }, { status: 500 });
  }
}
