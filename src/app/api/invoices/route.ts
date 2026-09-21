import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { findOrCreateCustomer, ensureItemsInCatalog } from "@/lib/catalog";
import { recordInvoicePayment } from "@/lib/finance";
import { nextInvoiceNumber } from "@/lib/sequence";
import { toNumber } from "@/lib/money";
import { parseDateOnly, parsePagination, buildSearch } from "@/lib/utils";
import { requireFeature, requireWrite } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { invoiceCreateSchema } from "@/lib/validations/finance";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireFeature(user, "faturacao"); if (denied) return denied;

  const url = new URL(request.url);
  const { page, limit, skip } = parsePagination(url.searchParams);
  const search = buildSearch(["number", "customer", "customerEmail"], url.searchParams.get("search"));
  const status = url.searchParams.get("status") ?? undefined;
  const where = {
    companyId: user.companyId,
    ...(search ?? {}),
    ...(status ? { status } : {}),
  };

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json({
    invoices: invoices.map((i) => ({
      ...i,
      subtotal: toNumber(i.subtotal),
      discountValue: toNumber(i.discountValue),
      discount: toNumber(i.discount),
      total: toNumber(i.total),
      paidAmount: toNumber(i.paidAmount),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireWrite(user, "faturacao"); if (denied) return denied;
  const companyId = user.companyId;

  try {
    const parsed = await parseBody(request, invoiceCreateSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;

    const customer = body.customer || null;
    const notes = body.notes || null;
    const status = body.status ?? "pending";

    let dueDate: Date | null = null;
    if (body.dueDate) {
      dueDate = parseDateOnly(body.dueDate) ?? new Date(body.dueDate);
      if (isNaN(dueDate.getTime())) return NextResponse.json({ error: "A data de vencimento não é válida." }, { status: 400 });
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

    const paidAmount = status === "paid" ? total : body.paidAmount ?? 0;

    const invoice = await prisma.$transaction(async (tx) => {
    await findOrCreateCustomer(companyId, customer || "", tx, user);
    await ensureItemsInCatalog(companyId, normalizedItems, tx, user);

    const number = await nextInvoiceNumber(tx, companyId);

    const created = await tx.invoice.create({
      data: {
        companyId,
        number,
        customer,
        customerEmail: body.customerEmail || null,
        customerPhone: body.customerPhone || null,
        customerNif: body.customerNif || null,
        subtotal,
        discountType,
        discountValue,
        discount,
        installments,
        currency,
        paymentMethod,
        bankDetails,
        total,
        paidAmount,
        status,
        dueDate,
        notes,
        items: { create: normalizedItems.map(({ kind: _kind, ...rest }) => rest) },
      },
      include: { items: true },
    });

    const payable = Math.min(paidAmount, total);
    if (payable > 0) {
      await recordInvoicePayment(companyId, created.id, number, payable, tx, user);
    }

    return created;
  });

    return NextResponse.json({
      invoice: {
        ...invoice,
        subtotal: toNumber(invoice.subtotal),
        discountValue: toNumber(invoice.discountValue),
        discount: toNumber(invoice.discount),
        total: toNumber(invoice.total),
        paidAmount: toNumber(invoice.paidAmount),
        items: invoice.items.map((it) => ({ ...it, unitPrice: toNumber(it.unitPrice), total: toNumber(it.total) })),
      },
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const error = /descrição|quantidade|preço/.test(message) ? message : "Erro ao criar fatura.";
    return NextResponse.json({ error }, { status: 400 });
  }
}
