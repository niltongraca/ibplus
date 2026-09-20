import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { recordExpensePayment, revertExpensePayment } from "@/lib/finance";
import { toNumber } from "@/lib/money";
import { parseDateOnly } from "@/lib/utils";
import { requireFeature, requireWrite, requireDelete } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { expenseUpdateSchema } from "@/lib/validations/finance";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireFeature(user, "despesas"); if (denied) return denied;

  const { id } = await params;
  const expense = await prisma.expense.findFirst({
    where: { id, companyId: user.companyId },
  });

  if (!expense) return NextResponse.json({ error: "Despesa não encontrada." }, { status: 404 });
  return NextResponse.json({ expense: { ...expense, amount: toNumber(expense.amount) } });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireWrite(user, "despesas"); if (denied) return denied;
  const companyId = user.companyId;

  const { id } = await params;
  const parsed = await parseBody(request, expenseUpdateSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;
  const existing = await prisma.expense.findFirst({ where: { id, companyId } });
  if (!existing) return NextResponse.json({ error: "Despesa não encontrada." }, { status: 404 });

  const update: Prisma.ExpenseUncheckedUpdateInput = {};

  if (body.description !== undefined) {
    update.description = body.description;
  }
  if (body.amount !== undefined) {
    update.amount = body.amount;
  }
  if (body.category !== undefined) update.category = body.category || "outros";
  if (body.date !== undefined && body.date) {
    const date = parseDateOnly(body.date) ?? new Date(body.date);
    if (isNaN(date.getTime())) return NextResponse.json({ error: "A data não é válida." }, { status: 400 });
    update.date = date;
  }
  if (body.paid !== undefined) update.paid = body.paid === true;
  if (body.notes !== undefined) update.notes = body.notes || null;

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.expense.updateMany({ where: { id, companyId }, data: update });
    if (!result.count) throw new Error("EXPENSE_NOT_FOUND");

    const refreshed = await tx.expense.findFirst({ where: { id, companyId } });
    if (refreshed?.paid) {
      await recordExpensePayment(companyId, refreshed.id, refreshed.description, toNumber(refreshed.amount), tx);
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
  const denied = await requireDelete(user, "despesas"); if (denied) return denied;
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
