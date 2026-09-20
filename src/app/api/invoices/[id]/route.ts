import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import { recordInvoicePayment, revertInvoicePayment, removeTransactionsByRef } from "@/lib/finance";
import { toNumber } from "@/lib/money";
import { parseDateOnly } from "@/lib/utils";
import { requireFeature, requireWrite, requireDelete } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { invoiceUpdateSchema } from "@/lib/validations/finance";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireFeature(user, "faturacao"); if (denied) return denied;

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId: user.companyId },
    include: { items: true },
  });

  if (!invoice) return NextResponse.json({ error: "Fatura não encontrada." }, { status: 404 });
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
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireWrite(user, "faturacao"); if (denied) return denied;
  const companyId = user.companyId;

  const { id } = await params;
  const existing = await prisma.invoice.findFirst({ where: { id, companyId } });
  if (!existing) return NextResponse.json({ error: "Fatura não encontrada." }, { status: 404 });

  const parsed = await parseBody(request, invoiceUpdateSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;
  const data: Prisma.InvoiceUpdateInput = {};

  if (body.customer !== undefined) data.customer = body.customer || null;
  if (body.customerEmail !== undefined) data.customerEmail = body.customerEmail || null;
  if (body.customerPhone !== undefined) data.customerPhone = body.customerPhone || null;
  if (body.customerNif !== undefined) data.customerNif = body.customerNif || null;
  if (body.notes !== undefined) data.notes = body.notes || null;

  const nextStatus = body.status ?? existing.status;
  data.status = nextStatus;

  const total = body.total ?? toNumber(existing.total);
  const calcPaidAmount = nextStatus === "paid" ? total : body.paidAmount ?? 0;
  data.paidAmount = Math.max(0, Math.min(total, calcPaidAmount));
  data.total = total;

  if (body.dueDate !== undefined) {
    if (body.dueDate) {
      const dueDate = parseDateOnly(body.dueDate) ?? new Date(body.dueDate);
      if (isNaN(dueDate.getTime())) return NextResponse.json({ error: "A data de vencimento não é válida." }, { status: 400 });
      data.dueDate = dueDate;
    } else {
      data.dueDate = null;
    }
  }

  // Full/partial items replacement + recompute totals
  if (body.items) {
    const normalizedItems = body.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.quantity * i.unitPrice,
      kind: i.kind ?? "product",
    }));
    const subtotal = normalizedItems.reduce((s, i) => s + i.total, 0);
    data.subtotal = subtotal;
    data.items = { deleteMany: {}, create: normalizedItems.map(({ kind: _kind, ...rest }) => rest) };

    if (body.discountValue !== undefined || body.discountType !== undefined) {
      const discountType = body.discountType === "percentage" ? "percentage" : (body.discountType ?? existing.discountType);
      const discountValue = body.discountValue ?? toNumber(existing.discountValue);
      data.discountType = discountType;
      data.discountValue = discountValue;
      data.discount = discountType === "percentage" ? subtotal * Math.min(100, discountValue) / 100 : Math.min(subtotal, discountValue);
      data.total = Math.max(0, subtotal - (data.discount as number));
    }
  } else {
    // Recompute discount if subtotal/discount changed without items
    const subtotal = body.subtotal ?? toNumber(existing.subtotal);
    const discountType = body.discountType === "percentage" ? "percentage" : existing.discountType;
    const discountValue = body.discountValue ?? toNumber(existing.discountValue);
    data.discountType = discountType;
    data.discountValue = discountValue;
    data.discount = discountType === "percentage" ? subtotal * Math.min(100, discountValue) / 100 : Math.min(subtotal, discountValue);
    data.total = total;
  }

  if (body.installments !== undefined) data.installments = body.installments;
  if (body.currency !== undefined) data.currency = body.currency || "AOA";
  if (body.paymentMethod !== undefined) data.paymentMethod = body.paymentMethod || null;
  if (body.bankDetails !== undefined) data.bankDetails = body.bankDetails || null;

  const wasPaid = Number(existing.paidAmount) > 0 || existing.status === "paid";
  const isPaid = data.status === "paid" || (data.status === "partially_paid" && (data.paidAmount as number) > 0);

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({ where: { id }, data });

    if (isPaid) {
      await recordInvoicePayment(companyId, id, existing.number, data.paidAmount as number, tx);
    } else if (wasPaid) {
      await revertInvoicePayment(companyId, id, existing.number, tx);
    }
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireDelete(user, "faturacao"); if (denied) return denied;
  const companyId = user.companyId;

  const { id } = await params;
  const existing = await prisma.invoice.findFirst({ where: { id, companyId } });
  if (!existing) return NextResponse.json({ error: "Fatura não encontrada." }, { status: 404 });

  const result = await prisma.$transaction(async (tx) => {
    const removed = await tx.invoice.deleteMany({ where: { id, companyId } });
    if (!removed.count) throw new Error("INVOICE_NOT_FOUND");
    if (Number(existing.paidAmount) > 0) {
      await removeTransactionsByRef(companyId, "invoice", id, tx);
    }
    return removed;
  }).catch((err) => {
    if (err instanceof Error && err.message === "INVOICE_NOT_FOUND") return null;
    throw err;
  });

  if (!result) return NextResponse.json({ error: "Fatura não encontrada." }, { status: 404 });
  return NextResponse.json({ success: true });
}
