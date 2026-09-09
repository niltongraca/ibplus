import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { recordInvoicePayment, revertInvoicePayment, removeTransactionsByRef } from "@/lib/finance";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId: user.companyId },
    include: { items: true },
  });

  if (!invoice) return NextResponse.json({ error: "Fatura não encontrada." }, { status: 404 });
  return NextResponse.json({ invoice });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.invoice.findFirst({ where: { id, companyId: user.companyId } });
  if (!existing) return NextResponse.json({ error: "Fatura não encontrada." }, { status: 404 });

  const body = await request.json();
  const data: Record<string, any> = {};

  if (body.customer !== undefined) data.customer = body.customer ? String(body.customer).trim() : null;
  if (body.customerEmail !== undefined) data.customerEmail = body.customerEmail ? String(body.customerEmail).trim() : null;
  if (body.customerPhone !== undefined) data.customerPhone = body.customerPhone ? String(body.customerPhone).trim() : null;
  if (body.customerNif !== undefined) data.customerNif = body.customerNif ? String(body.customerNif).trim() : null;
  if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;

  const nextStatus = body.status !== undefined ? String(body.status) : existing.status;
  if (!["paid", "partially_paid", "pending"].includes(nextStatus)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }
  data.status = nextStatus;

  const total = Number(body.total) || existing.total;
  const calcPaidAmount = nextStatus === "paid" ? total : Number(body.paidAmount) ?? 0;
  data.paidAmount = Math.max(0, Math.min(total, calcPaidAmount));
  data.total = total;

  if (body.dueDate !== undefined) {
    if (body.dueDate) {
      const dueDate = new Date(body.dueDate);
      if (isNaN(dueDate.getTime())) return NextResponse.json({ error: "A data de vencimento não é válida." }, { status: 400 });
      data.dueDate = dueDate;
    } else {
      data.dueDate = null;
    }
  }

  // Full/partial items replacement + recompute totals
  if (Array.isArray(body.items)) {
    if (!body.items.length) return NextResponse.json({ error: "A fatura precisa de pelo menos um item." }, { status: 400 });
    const normalizedItems = body.items.map((i) => {
      const description = i.description ? String(i.description).trim() : "";
      const quantity = Number(i.quantity);
      const unitPrice = Number(i.unitPrice);
      if (!description) throw new Error("A descrição de cada item é obrigatória.");
      if (!Number.isInteger(quantity) || quantity <= 0) throw new Error("A quantidade deve ser um número inteiro positivo.");
      if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error("O preço unitário não pode ser negativo.");
      return { description, quantity, unitPrice, total: quantity * unitPrice };
    });
    const subtotal = normalizedItems.reduce((s, i) => s + i.total, 0);
    data.subtotal = subtotal;
    data.items = { deleteMany: {}, create: normalizedItems };

    if (body.discountValue !== undefined || body.discountType !== undefined) {
      const discountType = body.discountType === "percentage" ? "percentage" : (body.discountType ?? existing.discountType);
      const discountValue = Number(body.discountValue) ?? existing.discountValue;
      data.discountType = discountType;
      data.discountValue = discountValue;
      data.discount = discountType === "percentage" ? subtotal * Math.min(100, discountValue) / 100 : Math.min(subtotal, discountValue);
      data.total = Math.max(0, subtotal - (data.discount as number));
    }
  } else {
    // Recompute discount if subtotal/discount changed without items
    const subtotal = Number(body.subtotal) || existing.subtotal;
    const discountType = body.discountType === "percentage" ? "percentage" : existing.discountType;
    const discountValue = Number(body.discountValue) ?? existing.discountValue;
    data.discountType = discountType;
    data.discountValue = discountValue;
    data.discount = discountType === "percentage" ? subtotal * Math.min(100, discountValue) / 100 : Math.min(subtotal, discountValue);
    data.total = total;
  }

  if (body.installments !== undefined) data.installments = Math.max(1, Math.floor(Number(body.installments)) || 1);
  if (body.currency !== undefined) data.currency = body.currency ? String(body.currency).trim() : "AOA";
  if (body.paymentMethod !== undefined) data.paymentMethod = body.paymentMethod ? String(body.paymentMethod).trim() : null;
  if (body.bankDetails !== undefined) data.bankDetails = body.bankDetails ? String(body.bankDetails).trim() : null;

  const wasPaid = Number(existing.paidAmount) > 0 || existing.status === "paid";
  const isPaid = data.status === "paid" || (data.status === "partially_paid" && (data.paidAmount as number) > 0);

  await prisma.invoice.update({ where: { id }, data });

  if (isPaid) {
    await recordInvoicePayment(user.companyId, id, existing.number, data.paidAmount as number);
  } else if (wasPaid) {
    await revertInvoicePayment(user.companyId, id, existing.number);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.invoice.findFirst({ where: { id, companyId: user.companyId } });
  if (!existing) return NextResponse.json({ error: "Fatura não encontrada." }, { status: 404 });

  const result = await prisma.invoice.deleteMany({ where: { id, companyId: user.companyId } });

  if (!result.count) return NextResponse.json({ error: "Fatura não encontrada." }, { status: 404 });

  if (Number(existing.paidAmount) > 0) {
    await removeTransactionsByRef(user.companyId, "invoice", id);
  }
  return NextResponse.json({ success: true });
}
