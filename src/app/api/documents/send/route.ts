import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { requireWrite } from "@/lib/permissions";
import { toNumber } from "@/lib/money";
import { buildDocumentHtml } from "@/lib/exportDocument";
import { sendEmail } from "@/lib/email";
import { logAction } from "@/lib/audit";
import { parseBody } from "@/lib/validations/helpers";
import { documentSendSchema } from "@/lib/validations/admin";

type DocType = "FATURA" | "ORÇAMENTO";

interface SendableItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

function serializeItems(items: Array<{ description: string; quantity: number; unitPrice: unknown; total: unknown }>): SendableItem[] {
  return items.map((it) => ({
    description: it.description,
    quantity: it.quantity,
    unitPrice: toNumber(it.unitPrice),
    total: toNumber(it.total),
  }));
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = await parseBody(request, documentSendSchema);
  if ("error" in parsed) return parsed.error;
  const { type, id, to } = parsed.data;
  const explicitTo = to || "";

  const denied = await requireWrite(user, type === "FATURA" ? "faturacao" : "orcamentos");
  if (denied) return denied;

  const company = await prisma.company.findUnique({ where: { id: user.companyId } });
  const companyInfo = company
    ? {
        name: company.name,
        nif: company.nif,
        email: company.email,
        phone: company.phone,
        address: company.address,
        logo: company.logo,
      }
    : null;

  interface SendData {
    number: string;
    customer: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    customerNif: string | null;
    date: string;
    secondaryDateLabel: string;
    secondaryDate: string | null;
    status: string;
    notes: string | null;
    items: SendableItem[];
    subtotal: number;
    discountType: string;
    discountValue: number;
    discount: number;
    installments: number;
    currency: string;
    paymentMethod: string | null;
    bankDetails: string | null;
    paidAmount: number;
    total: number;
  }

  let data: SendData | null = null;

  if (type === "FATURA") {
    const doc = await prisma.invoice.findFirst({
      where: { id, companyId: user.companyId },
      include: { items: true },
    });
    if (!doc) return NextResponse.json({ error: "Fatura não encontrada." }, { status: 404 });
    data = {
      number: doc.number,
      customer: doc.customer,
      customerEmail: doc.customerEmail,
      customerPhone: doc.customerPhone,
      customerNif: doc.customerNif,
      date: doc.date.toISOString(),
      secondaryDateLabel: "Vencimento",
      secondaryDate: doc.dueDate ? doc.dueDate.toISOString() : null,
      status: doc.status,
      notes: doc.notes,
      items: serializeItems(doc.items),
      subtotal: toNumber(doc.subtotal),
      discountType: doc.discountType,
      discountValue: toNumber(doc.discountValue),
      discount: toNumber(doc.discount),
      installments: doc.installments,
      currency: doc.currency,
      paymentMethod: doc.paymentMethod,
      bankDetails: doc.bankDetails,
      paidAmount: toNumber(doc.paidAmount),
      total: toNumber(doc.total),
    };
  } else {
    const doc = await prisma.quote.findFirst({
      where: { id, companyId: user.companyId },
      include: { items: true },
    });
    if (!doc) return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
    data = {
      number: doc.number,
      customer: doc.customer,
      customerEmail: doc.customerEmail,
      customerPhone: doc.customerPhone,
      customerNif: doc.customerNif,
      date: doc.date.toISOString(),
      secondaryDateLabel: "Validade",
      secondaryDate: doc.validUntil ? doc.validUntil.toISOString() : null,
      status: doc.status,
      notes: doc.notes,
      items: serializeItems(doc.items),
      subtotal: toNumber(doc.subtotal),
      discountType: doc.discountType,
      discountValue: toNumber(doc.discountValue),
      discount: toNumber(doc.discount),
      installments: doc.installments,
      currency: doc.currency,
      paymentMethod: doc.paymentMethod,
      bankDetails: doc.bankDetails,
      paidAmount: 0,
      total: toNumber(doc.total),
    };
  }

  const recipient = explicitTo || data.customerEmail || "";
  if (!recipient) {
    return NextResponse.json(
      { error: "O cliente deste documento não tem email definido. Indique o destinatário." },
      { status: 400 }
    );
  }

  const subject = `${type} ${data.number}${companyInfo?.name ? ` — ${companyInfo.name}` : ""}`;
  const html = buildDocumentHtml(
    {
      type,
      typeLabel: type === "FATURA" ? "da Factura" : "do Orçamento",
      number: data.number,
      customer: data.customer,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      customerNif: data.customerNif,
      date: data.date,
      secondaryDateLabel: data.secondaryDateLabel,
      secondaryDate: data.secondaryDate,
      status: data.status,
      notes: data.notes,
      items: data.items,
      subtotal: data.subtotal,
      discountType: data.discountType,
      discountValue: data.discountValue,
      discount: data.discount,
      installments: data.installments,
      currency: data.currency,
      paymentMethod: data.paymentMethod,
      bankDetails: data.bankDetails,
      paidAmount: data.paidAmount,
      total: data.total,
    },
    companyInfo
  );

  const result = await sendEmail(recipient, subject, html);
  if (!result.success) {
    return NextResponse.json({ error: result.error || "Falha ao enviar o email." }, { status: 500 });
  }

  await logAction("send", type === "FATURA" ? "invoice" : "quote", id, `${type} enviado por email para ${recipient}`, user);
  return NextResponse.json({ success: true, to: recipient });
}