import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { requireFeature, requireWrite } from "@/lib/permissions";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireFeature(user, "produtos"); if (denied) return denied;

  const categories = await prisma.category.findMany({
    where: { companyId: user.companyId },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireWrite(user, "produtos"); if (denied) return denied;

  try {
    const { name } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });

    const existing = await prisma.category.findFirst({ where: { companyId: user.companyId, name: name.trim() } });
    if (existing) return NextResponse.json({ error: "Categoria já existe." }, { status: 409 });

    const category = await prisma.category.create({ data: { companyId: user.companyId, name: name.trim() } });
    return NextResponse.json({ category }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar categoria." }, { status: 400 });
  }
}
