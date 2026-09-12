import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { parsePagination, buildSearch } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const featured = searchParams.get("featured");
    const { page, limit, skip } = parsePagination(searchParams);

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
    const search = buildSearch(["title", "description", "author"], searchParams.get("search"));
    if (search) where.OR = search.OR;

    const [content, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.content.count({ where }),
    ]);

    return NextResponse.json({ content, total, page, totalPages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar conteúdos." }, { status: 500 });
  }
}
