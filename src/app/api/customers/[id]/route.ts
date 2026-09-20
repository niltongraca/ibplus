import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { toNumber } from "@/lib/money";
import { requireFeature, requireWrite, requireDelete } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { customerUpdateSchema } from "@/lib/validations/catalog";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireFeature(user, "clientes"); if (denied) return denied;

  const { id } = await params;
  const customer = await prisma.customer.findFirst({
    where: { id, companyId: user.companyId },
    include: { sales: { take: 10, orderBy: { date: "desc" } } },
  });

  if (!customer) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  return NextResponse.json({
    customer: {
      ...customer,
      sales: customer.sales.map((s) => ({ ...s, total: toNumber(s.total) })),
    },
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireWrite(user, "clientes"); if (denied) return denied;

  const { id } = await params;
  const existing = await prisma.customer.findFirst({ where: { id, companyId: user.companyId } });
  if (!existing) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

  const parsed = await parseBody(request, customerUpdateSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const data: Prisma.CustomerUncheckedUpdateInput = {};

  if (body.name !== undefined) {
    data.name = body.name;
  }
  if (body.email !== undefined) {
    data.email = body.email || null;
  }
  if (body.phone !== undefined) data.phone = body.phone || null;
  if (body.nif !== undefined) data.nif = body.nif || null;
  if (body.address !== undefined) data.address = body.address || null;
  if (body.type !== undefined) data.type = body.type ?? "particular";
  if (body.notes !== undefined) data.notes = body.notes || null;
  if (body.stage !== undefined) data.stage = body.stage || null;

  const result = await prisma.customer.updateMany({ where: { id, companyId: user.companyId }, data });

  if (!result.count) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  await logAction("update", "customer", id, `Cliente atualizado`);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireDelete(user, "clientes"); if (denied) return denied;

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
