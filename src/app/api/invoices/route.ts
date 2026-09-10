import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { findOrCreateCustomer, ensureItemsInCatalog } from "@/lib/catalog";
import { recordInvoicePayment } from "@/lib/finance";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const invoices = await prisma.invoice.findMany({
    where: { companyId: user.companyId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const companyId = user.companyId;

  try {
    const body = await request.json();
    const customer = body.customer ? String(body.customer).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : null;
    const status = typeof body.status === "string" && ["paid", "partially_paid", "pending"].includes(body.status) ? body.status : "pending";

    let dueDate: Date | null = null;
    if (body.dueDate) {
      dueDate = new Date(body.dueDate);
      if (isNaN(dueDate.getTime())) return NextResponse.json({ error: "A data de vencimento não é válida." }, { status: 400 });
    }

    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return NextResponse.json({ error: "A fatura precisa de pelo menos um item." }, { status: 400 });

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

    const paidAmount = status === "paid" ? total : Number(body.paidAmount) || 0;

    const invoice = await prisma.$transaction(async (tx) => {
    await findOrCreateCustomer(companyId, customer || "", tx);
    await ensureItemsInCatalog(companyId, normalizedItems, tx);

    const count = await tx.invoice.count({ where: { companyId } });
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const number = `FAT-${dateStr}-${String(count + 1).padStart(4, "0")}`;

    const created = await tx.invoice.create({
      data: {
        companyId,
        number,
        customer,
        customerEmail: body.customerEmail ? String(body.customerEmail).trim() : null,
        customerPhone: body.customerPhone ? String(body.customerPhone).trim() : null,
        customerNif: body.customerNif ? String(body.customerNif).trim() : null,
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
        items: { create: normalizedItems },
      },
      include: { items: true },
    });

    const payable = Math.min(paidAmount, total);
    if (payable > 0) {
      await recordInvoicePayment(companyId, created.id, number, payable, tx);
    }

    return created;
  });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "";
    const error = /descrição|quantidade|preço/.test(message) ? message : "Erro ao criar fatura.";
    return NextResponse.json({ error }, { status: 400 });
  }
}
