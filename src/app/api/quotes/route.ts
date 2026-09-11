import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { findOrCreateCustomer, ensureItemsInCatalog } from "@/lib/catalog";
import { nextQuoteNumber } from "@/lib/sequence";
import { toNumber } from "@/lib/money";
import { parseDateOnly, parsePagination } from "@/lib/utils";

function serializeQuote(q: { subtotal?: unknown; discountValue?: unknown; discount?: unknown; total?: unknown; items: unknown[] } & Record<string, unknown>) {
  return {
    ...q,
    subtotal: toNumber(q.subtotal),
    discountValue: toNumber(q.discountValue),
    discount: toNumber(q.discount),
    total: toNumber(q.total),
    items: q.items.map((it) => {
      const item = it as Record<string, unknown>;
      return { ...item, unitPrice: toNumber(item.unitPrice), total: toNumber(item.total) };
    }),
  };
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const url = new URL(request.url);
    const { page, limit, skip } = parsePagination(url.searchParams);
    const where = { companyId: user.companyId };

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: { items: true },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.quote.count({ where }),
    ]);

    return NextResponse.json({
      quotes: quotes.map((q) => serializeQuote(q as never)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar orçamentos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const companyId = user.companyId;

  try {
    const body = await request.json();
    const customer = body.customer ? String(body.customer).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : null;
    const status = typeof body.status === "string" && ["approved", "pending"].includes(body.status) ? body.status : "pending";

    let validUntil: Date | null = null;
    if (body.validUntil) {
      validUntil = parseDateOnly(body.validUntil) ?? new Date(body.validUntil);
      if (isNaN(validUntil.getTime())) return NextResponse.json({ error: "A data de validade não é válida." }, { status: 400 });
    }

    const items: Array<{ description?: unknown; quantity?: unknown; unitPrice?: unknown }> = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return NextResponse.json({ error: "O orçamento precisa de pelo menos um item." }, { status: 400 });

    const normalizedItems = items.map((i) => {
      const description = i.description ? String(i.description).trim() : "";
      const quantity = Number(i.quantity);
      const unitPrice = Number(i.unitPrice);
      if (!description) throw new Error("A descrição de cada item é obrigatória.");
      if (!Number.isInteger(quantity) || quantity <= 0) throw new Error("A quantidade deve ser um número inteiro positivo.");
      if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error("O preço unitário não pode ser negativo.");
      return { description, quantity, unitPrice, total: quantity * unitPrice };
    });

    const subtotal = normalizedItems.reduce((sum, i) => sum + i.total, 0);
    const discountType = body.discountType === "percentage" ? "percentage" : "fixed";
    const discountValue = Number(body.discountValue) || 0;
    const discount = discountType === "percentage" ? subtotal * Math.min(100, discountValue) / 100 : Math.min(subtotal, discountValue);
    const total = Math.max(0, subtotal - discount);
    const installments = Math.max(1, Math.floor(Number(body.installments)) || 1);
    const currency = body.currency ? String(body.currency).trim() : "AOA";
    const paymentMethod = body.paymentMethod ? String(body.paymentMethod).trim() : null;
    const bankDetails = body.bankDetails ? String(body.bankDetails).trim() : null;

    const quote = await prisma.$transaction(async (tx) => {
      await findOrCreateCustomer(companyId, customer || "", tx);
      await ensureItemsInCatalog(companyId, normalizedItems, tx);

      const number = await nextQuoteNumber(tx, companyId);

      return tx.quote.create({
        data: {
          companyId,
          number,
          customer,
          customerEmail: body.customerEmail ? String(body.customerEmail).trim() : null,
          customerPhone: body.customerPhone ? String(body.customerPhone).trim() : null,
          customerNif: body.customerNif ? String(body.customerNif).trim() : null,
          validUntil,
          subtotal,
          discountType,
          discountValue,
          discount,
          installments,
          currency,
          paymentMethod,
          bankDetails,
          total,
          status,
          notes,
          items: { create: normalizedItems },
        },
        include: { items: true },
      });
    });

    return NextResponse.json({ quote: serializeQuote(quote as never) }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const error = /descrição|quantidade|preço/.test(message) ? message : "Erro ao criar orçamento.";
    return NextResponse.json({ error }, { status: 400 });
  }
}
