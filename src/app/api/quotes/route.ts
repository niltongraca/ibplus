import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { findOrCreateCustomer, ensureItemsInCatalog } from "@/lib/catalog";
import { nextQuoteNumber } from "@/lib/sequence";
import { toNumber } from "@/lib/money";
import { parseDateOnly, parsePagination, buildSearch } from "@/lib/utils";
import { requireFeature, requireWrite } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { quoteCreateSchema } from "@/lib/validations/finance";

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
    const denied = await requireFeature(user, "orcamentos"); if (denied) return denied;

    const url = new URL(request.url);
    const { page, limit, skip } = parsePagination(url.searchParams);
    const search = buildSearch(["number", "customer", "customerEmail"], url.searchParams.get("search"));
    const status = url.searchParams.get("status") ?? undefined;
    const where = {
      companyId: user.companyId,
      ...(search ?? {}),
      ...(status ? { status } : {}),
    };

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
  const denied = await requireWrite(user, "orcamentos"); if (denied) return denied;
  const companyId = user.companyId;

  try {
    const parsed = await parseBody(request, quoteCreateSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;

    const customer = body.customer || null;
    const notes = body.notes || null;
    const status = body.status ?? "pending";

    let validUntil: Date | null = null;
    if (body.validUntil) {
      validUntil = parseDateOnly(body.validUntil) ?? new Date(body.validUntil);
      if (isNaN(validUntil.getTime())) return NextResponse.json({ error: "A data de validade não é válida." }, { status: 400 });
    }

    const normalizedItems = body.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.quantity * i.unitPrice,
      kind: i.kind ?? "product",
    }));

    const subtotal = normalizedItems.reduce((sum, i) => sum + i.total, 0);
    const discountType = body.discountType === "percentage" ? "percentage" : "fixed";
    const discountValue = body.discountValue ?? 0;
    const discount = discountType === "percentage" ? subtotal * Math.min(100, discountValue) / 100 : Math.min(subtotal, discountValue);
    const total = Math.max(0, subtotal - discount);
    const installments = body.installments ?? 1;
    const currency = body.currency || "AOA";
    const paymentMethod = body.paymentMethod || null;
    const bankDetails = body.bankDetails || null;

    const quote = await prisma.$transaction(async (tx) => {
      await findOrCreateCustomer(companyId, customer || "", tx, user);
      await ensureItemsInCatalog(companyId, normalizedItems, tx, user);

      const number = await nextQuoteNumber(tx, companyId);

      return tx.quote.create({
        data: {
          companyId,
          number,
          customer,
          customerEmail: body.customerEmail || null,
          customerPhone: body.customerPhone || null,
          customerNif: body.customerNif || null,
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
