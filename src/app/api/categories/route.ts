import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const { name } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });

    const existing = await prisma.category.findFirst({ where: { name: name.trim() } });
    if (existing) return NextResponse.json({ error: "Categoria já existe." }, { status: 409 });

    const category = await prisma.category.create({ data: { name: name.trim() } });
    return NextResponse.json({ category }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar categoria." }, { status: 400 });
  }
}
