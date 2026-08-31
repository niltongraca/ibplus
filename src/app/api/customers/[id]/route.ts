import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const customer = await prisma.customer.findFirst({
    where: { id, companyId: user.companyId },
    include: { sales: { take: 10, orderBy: { date: "desc" } } },
  });

  if (!customer) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  return NextResponse.json({ customer });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.customer.findFirst({ where: { id, companyId: user.companyId } });
  if (!existing) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

  const body = await request.json();

  const data: Record<string, any> = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "O nome não pode ficar vazio." }, { status: 400 });
    data.name = name;
  }
  if (body.email !== undefined) {
    const email = body.email ? String(body.email).trim() : "";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "O email não é válido." }, { status: 400 });
    data.email = email || null;
  }
  if (body.phone !== undefined) data.phone = body.phone ? String(body.phone).trim() : null;
  if (body.nif !== undefined) data.nif = body.nif ? String(body.nif).trim() : null;
  if (body.address !== undefined) data.address = body.address ? String(body.address).trim() : null;
  if (body.type !== undefined) data.type = body.type === "empresa" ? "empresa" : "particular";
  if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;
  if (body.stage !== undefined) data.stage = String(body.stage);

  const result = await prisma.customer.updateMany({ where: { id, companyId: user.companyId }, data });

  if (!result.count) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  await logAction("update", "customer", id, `Cliente atualizado`);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const customer = await prisma.customer.findFirst({
    where: { id, companyId: user.companyId },
    include: { _count: { select: { sales: true, opportunities: true } } },
  });
  if (!customer) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

  if (customer._count.sales > 0 || customer._count.opportunities > 0) {
    return NextResponse.json(
      { error: "Este cliente tem vendas ou oportunidades associadas e não pode ser eliminado. Considere desactivá-lo." },
      { status: 409 }
    );
  }

  const result = await prisma.customer.deleteMany({ where: { id, companyId: user.companyId } });
  if (!result.count) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  await logAction("delete", "customer", id, `Cliente eliminado`);
  return NextResponse.json({ success: true });
}
