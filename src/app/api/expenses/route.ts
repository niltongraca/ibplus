import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parsePagination, parseDateOnly } from "@/lib/utils";
import { recordExpensePayment } from "@/lib/finance";
import { toNumber } from "@/lib/money";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const url = new URL(request.url);
  const { page, limit, skip } = parsePagination(url.searchParams);

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where: { companyId: user.companyId },
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.expense.count({ where: { companyId: user.companyId } }),
  ]);

  return NextResponse.json({
    expenses: expenses.map((e) => ({ ...e, amount: toNumber(e.amount) })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const companyId = user.companyId;

  try {
    const body = await request.json();
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (!description) return NextResponse.json({ error: "A descrição é obrigatória." }, { status: 400 });

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "O valor deve ser um número positivo." }, { status: 400 });
    }

    const category = body.category ? String(body.category).trim() : "outros";
    const date = body.date ? (parseDateOnly(body.date) ?? new Date(body.date)) : new Date();
    if (isNaN(date.getTime())) return NextResponse.json({ error: "A data não é válida." }, { status: 400 });

    const expense = await prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          companyId,
          description,
          amount,
          category,
          date,
          paid: body.paid === true,
          notes: body.notes ? String(body.notes).trim() : null,
        },
      });
      if (created.paid) {
        await recordExpensePayment(companyId, created.id, created.description, toNumber(created.amount), tx);
      }
      return created;
    });
    return NextResponse.json({ expense: { ...expense, amount: toNumber(expense.amount) } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar despesa." }, { status: 400 });
  }
}
