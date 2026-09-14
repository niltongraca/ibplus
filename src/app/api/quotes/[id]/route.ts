import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { nextInvoiceNumber } from "@/lib/sequence";
import { toNumber } from "@/lib/money";
import { parseDateOnly } from "@/lib/utils";
import { requireFeature, requireWrite, requireDelete } from "@/lib/permissions";

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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireFeature(user, "orcamentos"); if (denied) return denied;

  const { id } = await params;
  const quote = await prisma.quote.findFirst({
    where: { id, companyId: user.companyId },
    include: { items: true },
  });

  if (!quote) return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
  return NextResponse.json({ quote: serializeQuote(quote as never) });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireWrite(user, "orcamentos"); if (denied) return denied;
  const companyId = user.companyId;

  const { id } = await params;
  const quote = await prisma.quote.findFirst({
    where: { id, companyId },
    include: { items: true },
  });
  if (!quote) return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });

  const body = await request.json();
  if (body.items !== undefined && body.items !== null && !Array.isArray(body.items)) {
    return NextResponse.json({ error: "Os itens devem ser uma lista." }, { status: 400 });
  }

  const data: Prisma.QuoteUpdateInput = {};

  if (body.customer !== undefined) data.customer = body.customer ? String(body.customer).trim() : null;
  if (body.customerEmail !== undefined) data.customerEmail = body.customerEmail ? String(body.customerEmail).trim() : null;
  if (body.customerPhone !== undefined) data.customerPhone = body.customerPhone ? String(body.customerPhone).trim() : null;
  if (body.customerNif !== undefined) data.customerNif = body.customerNif ? String(body.customerNif).trim() : null;
  if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;
  if (body.validUntil !== undefined) {
    if (body.validUntil) {
      const validUntil = parseDateOnly(body.validUntil) ?? new Date(body.validUntil);
      if (isNaN(validUntil.getTime())) return NextResponse.json({ error: "A data de validade não é válida." }, { status: 400 });
      data.validUntil = validUntil;
    } else {
      data.validUntil = null;
    }
  }
  if (body.installments !== undefined) data.installments = Math.max(1, Math.floor(Number(body.installments)) || 1);
  if (body.currency !== undefined) data.currency = body.currency ? String(body.currency).trim() : "AOA";
  if (body.paymentMethod !== undefined) data.paymentMethod = body.paymentMethod ? String(body.paymentMethod).trim() : null;
  if (body.bankDetails !== undefined) data.bankDetails = body.bankDetails ? String(body.bankDetails).trim() : null;
  if (body.status !== undefined) {
    const status = String(body.status);
    if (!["pending", "approved"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }
    data.status = status;
  }

  // Handle items replacement + totals recalculation
  if (Array.isArray(body.items)) {
    const rawItems: Array<{ description?: unknown; quantity?: unknown; unitPrice?: unknown; kind?: unknown }> = body.items;
    if (!rawItems.length) return NextResponse.json({ error: "O orçamento precisa de pelo menos um item." }, { status: 400 });
    const normalizedItems = rawItems.map((i) => {
      const description = i.description ? String(i.description).trim() : "";
      const quantity = Number(i.quantity);
      const unitPrice = Number(i.unitPrice);
      if (!description) throw new Error("A descrição de cada item é obrigatória.");
      if (!Number.isInteger(quantity) || quantity <= 0) throw new Error("A quantidade deve ser um número inteiro positivo.");
      if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error("O preço unitário não pode ser negativo.");
      return { description, quantity, unitPrice, total: quantity * unitPrice, kind: i.kind === "service" ? "service" : "product" };
    });
    const subtotal = normalizedItems.reduce((sum, i) => sum + i.total, 0);
    data.subtotal = subtotal;
    data.items = { deleteMany: {}, create: normalizedItems.map(({ kind: _kind, ...rest }) => rest) };

    const discountType = body.discountType !== undefined ? (body.discountType === "percentage" ? "percentage" : "fixed") : quote.discountType;
    const discountValue = body.discountValue !== undefined ? Number(body.discountValue) : toNumber(quote.discountValue);
    data.discountType = discountType;
    data.discountValue = discountValue;
    data.discount = discountType === "percentage" ? subtotal * Math.min(100, discountValue) / 100 : Math.min(subtotal, discountValue);
    data.total = Math.max(0, subtotal - (data.discount as number));
  } else {
    if (body.discountType !== undefined || body.discountValue !== undefined) {
      const discountType = body.discountType !== undefined ? (body.discountType === "percentage" ? "percentage" : "fixed") : quote.discountType;
      const discountValue = body.discountValue !== undefined ? Number(body.discountValue) : toNumber(quote.discountValue);
      const subtotal = data.subtotal !== undefined ? (data.subtotal as number) : toNumber(quote.subtotal);
      data.discountType = discountType;
      data.discountValue = discountValue;
      data.discount = discountType === "percentage" ? subtotal * Math.min(100, discountValue) / 100 : Math.min(subtotal, discountValue);
      data.total = Math.max(0, subtotal - (data.discount as number));
    }
  }

  // Auto-generate invoice on approval (avoid duplicates)
  await prisma.$transaction(async (tx) => {
    if (data.status === "approved" && quote.status !== "approved") {
      const invoiceNotes = `Gerado a partir do orçamento ${quote.number}`;
      const existing = await tx.invoice.findFirst({
        where: { companyId, notes: invoiceNotes },
      });
      if (!existing) {
        const number = await nextInvoiceNumber(tx, companyId);

        const finalItems = data.items && data.items.create ? (data.items.create as Prisma.QuoteItemCreateWithoutQuoteInput[]) : quote.items;
        const finalSubtotal = (data.subtotal as number) ?? toNumber(quote.subtotal);
        const finalTotal = (data.total as number) ?? toNumber(quote.total);
        const finalDiscount = (data.discount as number) ?? toNumber(quote.discount);
        const finalDiscountType = (data.discountType as string) ?? quote.discountType;
        const finalDiscountValue = (data.discountValue as number) ?? toNumber(quote.discountValue);

        await tx.invoice.create({
          data: {
            companyId,
            number,
            customer: (data.customer ?? quote.customer) as string | null,
            customerEmail: (data.customerEmail ?? quote.customerEmail) as string | null,
            customerPhone: (data.customerPhone ?? quote.customerPhone) as string | null,
            customerNif: (data.customerNif ?? quote.customerNif) as string | null,
            subtotal: finalSubtotal,
            discountType: finalDiscountType,
            discountValue: finalDiscountValue,
            discount: finalDiscount,
            installments: (data.installments as number) ?? quote.installments,
            currency: (data.currency as string) ?? quote.currency,
            paymentMethod: (data.paymentMethod as string) ?? quote.paymentMethod,
            bankDetails: (data.bankDetails as string) ?? quote.bankDetails,
            total: finalTotal,
            status: "pending",
            notes: invoiceNotes,
            items: {
              create: finalItems.map((i) => ({
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                total: i.total,
              })),
            },
          },
        });
      }
    }

    await tx.quote.update({ where: { id }, data });
  });

  await logAction("update", "quote", id, `Orçamento atualizado`);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireDelete(user, "orcamentos"); if (denied) return denied;

  const { id } = await params;
  const result = await prisma.quote.deleteMany({ where: { id, companyId: user.companyId } });

  if (!result.count) return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
  return NextResponse.json({ success: true });
}
