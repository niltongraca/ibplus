import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const featured = searchParams.get("featured");

    const where: any = { published: true };
    if (type) where.type = type.toUpperCase();
    if (featured === "true") where.featured = true;

    const content = await prisma.content.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar conteúdos." }, { status: 500 });
  }
}
