import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parsePagination, buildSearch } from "@/lib/utils";
import type { Prisma, ContentType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const search = buildSearch(["title", "author", "type"], searchParams.get("search"));
    const type = searchParams.get("type") || undefined;
    const where: Prisma.ContentWhereInput = {
      ...(search ?? {}),
      ...(type ? { type: type as ContentType } : {}),
    };
    const [content, total] = await Promise.all([
      prisma.content.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.content.count({ where }),
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
