import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const stage = searchParams.get("stage") || undefined;

  if (!user.companyId) {
    return NextResponse.json({ opportunities: [] });
  }

  const where: any = { companyId: user.companyId };
  if (stage) where.stage = stage;

  const opportunities = await prisma.opportunity.findMany({
    where,
    include: { customer: { select: { name: true, email: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ opportunities });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const { customerId, title, value, stage, notes } = await request.json();
    const opportunity = await prisma.opportunity.create({
      data: { companyId: user.companyId, customerId, title, value, stage, notes },
    });
    return NextResponse.json({ opportunity }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar oportunidade." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const { id, stage, value, notes } = await request.json();
    const opportunity = await prisma.opportunity.updateMany({
      where: { id, companyId: user.companyId },
      data: { stage, value, notes },
    });
    return NextResponse.json({ opportunity });
  } catch {
    return NextResponse.json({ error: "Erro ao actualizar." }, { status: 400 });
  }
}
