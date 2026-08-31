import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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

  try {
    const body = await request.json();
    const customer = body.customer ? String(body.customer).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : null;
    const status = typeof body.status === "string" && ["draft", "sent", "paid", "overdue", "cancelled"].includes(body.status) ? body.status : "draft";

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

    const total = normalizedItems.reduce((sum, i) => sum + i.total, 0);

    const count = await prisma.invoice.count({ where: { companyId: user.companyId } });
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const number = `FAT-${dateStr}-${String(count + 1).padStart(4, "0")}`;

    const invoice = await prisma.invoice.create({
      data: {
        companyId: user.companyId,
        number,
        customer,
        total,
        status,
        dueDate,
        notes,
        items: { create: normalizedItems },
      },
      include: { items: true },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "";
    const error = /descrição|quantidade|preço/.test(message) ? message : "Erro ao criar fatura.";
    return NextResponse.json({ error }, { status: 400 });
  }
}
