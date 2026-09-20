import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { requireFeature, requireWrite } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { categoryCreateSchema } from "@/lib/validations/catalog";

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
    const parsed = await parseBody(request, categoryCreateSchema);
    if ("error" in parsed) return parsed.error;
    const { name } = parsed.data;

    const existing = await prisma.category.findFirst({ where: { companyId: user.companyId, name } });
    if (existing) return NextResponse.json({ error: "Categoria já existe." }, { status: 409 });

    const category = await prisma.category.create({ data: { companyId: user.companyId, name } });
    return NextResponse.json({ category }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar categoria." }, { status: 400 });
  }
}
