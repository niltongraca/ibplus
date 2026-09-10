import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { recordExpensePayment, revertExpensePayment } from "@/lib/finance";

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
  const companyId = user.companyId;

  const { id } = await params;
  const data = await request.json();
  const existing = await prisma.expense.findFirst({ where: { id, companyId } });
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

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.expense.updateMany({ where: { id, companyId }, data: update });
    if (!result.count) throw new Error("EXPENSE_NOT_FOUND");

    const refreshed = await tx.expense.findFirst({ where: { id, companyId } });
    if (refreshed?.paid) {
      await recordExpensePayment(companyId, refreshed.id, refreshed.description, refreshed.amount, tx);
    } else if (existing.paid) {
      await revertExpensePayment(companyId, refreshed!.id, refreshed!.description, tx);
    }
    return refreshed!;
  }).catch((err) => {
    if (err instanceof Error && err.message === "EXPENSE_NOT_FOUND") return null;
    throw err;
  });

  if (!updated) return NextResponse.json({ error: "Despesa não encontrada." }, { status: 404 });

  await logAction("update", "expense", id, `Despesa atualizada`);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const companyId = user.companyId;

  const { id } = await params;
  const existing = await prisma.expense.findFirst({ where: { id, companyId } });
  if (!existing) return NextResponse.json({ error: "Despesa não encontrada." }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    if (existing.paid) await revertExpensePayment(companyId, id, existing.description, tx);
    const result = await tx.expense.deleteMany({ where: { id, companyId } });
    if (!result.count) throw new Error("EXPENSE_NOT_FOUND");
  }).catch((err) => {
    if (err instanceof Error && err.message === "EXPENSE_NOT_FOUND") return null;
    throw err;
  });

  await logAction("delete", "expense", id, `Despesa eliminada`);
  return NextResponse.json({ success: true });
}
