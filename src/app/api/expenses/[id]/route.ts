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

  const result = await prisma.expense.updateMany({
    where: { id, companyId: user.companyId },
    data: {
      description: data.description ?? undefined,
      amount: data.amount !== undefined ? parseFloat(data.amount) : undefined,
      category: data.category ?? undefined,
      date: data.date ? new Date(data.date) : undefined,
      paid: data.paid ?? undefined,
      notes: data.notes ?? undefined,
    },
  });

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
