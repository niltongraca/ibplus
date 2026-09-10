import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const featured = searchParams.get("featured");

    const where: Prisma.ContentWhereInput = { published: true };
    if (type) {
      const t = type.toUpperCase();
      if (t === "VIDEO" || t === "POST" || t === "BOOK" || t === "ARTICLE") {
        where.type = t;
      } else {
        return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
      }
    }
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
