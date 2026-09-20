import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { requireWrite, requireDelete } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { categoryUpdateSchema } from "@/lib/validations/catalog";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireWrite(user, "produtos"); if (denied) return denied;

  const { id } = await params;
  const parsed = await parseBody(request, categoryUpdateSchema);
  if ("error" in parsed) return parsed.error;
  const { name } = parsed.data;

  const result = await prisma.category.updateMany({ where: { id, companyId: user.companyId }, data: { name } });
  if (!result.count) return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireDelete(user, "produtos"); if (denied) return denied;

  const { id } = await params;
  const category = await prisma.category.findFirst({ where: { id, companyId: user.companyId }, include: { _count: { select: { products: true } } } });
  if (!category) return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });

  if (category._count.products > 0) {
    return NextResponse.json({ error: "Não é possível eliminar: existem produtos nesta categoria." }, { status: 400 });
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
