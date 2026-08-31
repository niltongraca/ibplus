import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const expense = await prisma.expense.findFirst({
    where: { id, companyId: user.companyId },
  });

  if (!expense) return NextResponse.json({ error: "Despesa não encontrada." }, { status: 404 });
  return NextResponse.json({ expense });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const data = await request.json();
  const existing = await prisma.expense.findFirst({ where: { id, companyId: user.companyId } });
  if (!existing) return NextResponse.json({ error: "Despesa não encontrada." }, { status: 404 });

  const update: Record<string, any> = {};

  if (data.description !== undefined) {
    const desc = String(data.description).trim();
    if (!desc) return NextResponse.json({ error: "A descrição não pode ficar vazia." }, { status: 400 });
    update.description = desc;
  }
  if (data.amount !== undefined) {
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "O valor deve ser um número positivo." }, { status: 400 });
    update.amount = amount;
  }
  if (data.category !== undefined) update.category = data.category || "outros";
  if (data.date !== undefined) {
    const date = new Date(data.date);
    if (isNaN(date.getTime())) return NextResponse.json({ error: "A data não é válida." }, { status: 400 });
    update.date = date;
  }
  if (data.paid !== undefined) update.paid = data.paid === true;
  if (data.notes !== undefined) update.notes = data.notes ? String(data.notes).trim() : null;

  const result = await prisma.expense.updateMany({ where: { id, companyId: user.companyId }, data: update });

  if (!result.count) return NextResponse.json({ error: "Despesa não encontrada." }, { status: 404 });
  await logAction("update", "expense", id, `Despesa atualizada`);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const result = await prisma.expense.deleteMany({ where: { id, companyId: user.companyId } });

  if (!result.count) return NextResponse.json({ error: "Despesa não encontrada." }, { status: 404 });
  await logAction("delete", "expense", id, `Despesa eliminada`);
  return NextResponse.json({ success: true });
}
