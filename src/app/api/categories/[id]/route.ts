import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });

  const result = await prisma.category.updateMany({ where: { id }, data: { name: name.trim() } });
  if (!result.count) return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
  if (!category) return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });

  if (category._count.products > 0) {
    return NextResponse.json({ error: "Não é possível eliminar: existem produtos nesta categoria." }, { status: 400 });
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
