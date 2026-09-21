import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parsePagination, parseDateOnly, buildSearch, parseBool } from "@/lib/utils";
import { recordExpensePayment } from "@/lib/finance";
import { toNumber } from "@/lib/money";
import { requireFeature, requireWrite } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { expenseCreateSchema } from "@/lib/validations/finance";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireFeature(user, "despesas"); if (denied) return denied;

  const url = new URL(request.url);
  const { page, limit, skip } = parsePagination(url.searchParams);
  const all = url.searchParams.get("all") === "true";
  const search = buildSearch(["description", "category"], url.searchParams.get("search"));
  const paid = parseBool(url.searchParams.get("paid"));
  const where = {
    companyId: user.companyId,
    ...(search ?? {}),
    ...(paid !== undefined ? { paid } : {}),
  };

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      ...(all ? {} : { skip, take: limit }),
    }),
    prisma.expense.count({ where }),
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
  const denied = await requireWrite(user, "despesas"); if (denied) return denied;
  const companyId = user.companyId;

  try {
    const parsed = await parseBody(request, expenseCreateSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;

    const description = body.description;
    const amount = body.amount;
    const category = body.category || "outros";
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
        await recordExpensePayment(companyId, created.id, created.description, toNumber(created.amount), tx, user);
      }
      return created;
    });
    return NextResponse.json({ expense: { ...expense, amount: toNumber(expense.amount) } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar despesa." }, { status: 400 });
  }
}
