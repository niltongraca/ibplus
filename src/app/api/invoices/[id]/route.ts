import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId: user.companyId },
    include: { items: true },
  });

  if (!invoice) return NextResponse.json({ error: "Fatura não encontrada." }, { status: 404 });
  return NextResponse.json({ invoice });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.invoice.findFirst({ where: { id, companyId: user.companyId } });
  if (!existing) return NextResponse.json({ error: "Fatura não encontrada." }, { status: 404 });

  const body = await request.json();
  const data: Record<string, any> = {};

  if (body.customer !== undefined) data.customer = body.customer ? String(body.customer).trim() : null;
  if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;
  if (body.status !== undefined) {
    const status = String(body.status);
    if (!["draft", "sent", "paid", "overdue", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }
    data.status = status;
  }
  if (body.dueDate !== undefined) {
    if (body.dueDate) {
      const dueDate = new Date(body.dueDate);
      if (isNaN(dueDate.getTime())) return NextResponse.json({ error: "A data de vencimento não é válida." }, { status: 400 });
      data.dueDate = dueDate;
    } else {
      data.dueDate = null;
    }
  }

  await prisma.invoice.update({ where: { id }, data });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const result = await prisma.invoice.deleteMany({ where: { id, companyId: user.companyId } });

  if (!result.count) return NextResponse.json({ error: "Fatura não encontrada." }, { status: 404 });
  return NextResponse.json({ success: true });
}
