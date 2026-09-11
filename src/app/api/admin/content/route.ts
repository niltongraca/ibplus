import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parsePagination } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const [content, total] = await Promise.all([
      prisma.content.findMany({ orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.content.count(),
    ]);
    return NextResponse.json({ content, total, page, totalPages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar conteúdos." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    const { title, type, url, description, thumbnail, author, tags, featured } = await request.json();
    if (!title || !type || !url) {
      return NextResponse.json({ error: "Título, tipo e URL são obrigatórios." }, { status: 400 });
    }

    const content = await prisma.content.create({
      data: { title, type: type.toUpperCase(), url, description, thumbnail, author, tags, featured: featured || false },
    });

    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "Erro ao criar conteúdo." }, { status: 400 });
  }
}
