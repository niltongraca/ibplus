import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const quote = await prisma.quote.findFirst({
    where: { id, companyId: user.companyId },
    include: { items: true },
  });

  if (!quote) return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
  return NextResponse.json({ quote });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const quote = await prisma.quote.findFirst({
    where: { id, companyId: user.companyId },
    include: { items: true },
  });
  if (!quote) return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });

  const body = await request.json();
  if (body.items !== undefined && body.items !== null && !Array.isArray(body.items)) {
    return NextResponse.json({ error: "Os itens devem ser uma lista." }, { status: 400 });
  }

  const data: Record<string, any> = {};

  if (body.customer !== undefined) data.customer = body.customer ? String(body.customer).trim() : null;
  if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;
  if (body.validUntil !== undefined) {
    if (body.validUntil) {
      const validUntil = new Date(body.validUntil);
      if (isNaN(validUntil.getTime())) return NextResponse.json({ error: "A data de validade não é válida." }, { status: 400 });
      data.validUntil = validUntil;
    } else {
      data.validUntil = null;
    }
  }
  if (body.status !== undefined) {
    const status = String(body.status);
    if (!["draft", "pendente", "aprovado", "rejeitado", "expirado"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }
    data.status = status;
  }

  // Handle items replacement + total recalculation
  if (Array.isArray(body.items)) {
    if (!body.items.length) return NextResponse.json({ error: "O orçamento precisa de pelo menos um item." }, { status: 400 });
    const normalizedItems = body.items.map((i) => {
      const description = i.description ? String(i.description).trim() : "";
      const quantity = Number(i.quantity);
      const unitPrice = Number(i.unitPrice);
      if (!description) throw new Error("A descrição de cada item é obrigatória.");
      if (!Number.isInteger(quantity) || quantity <= 0) throw new Error("A quantidade deve ser um número inteiro positivo.");
      if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error("O preço unitário não pode ser negativo.");
      return { description, quantity, unitPrice, total: quantity * unitPrice };
    });
    data.total = normalizedItems.reduce((sum, i) => sum + i.total, 0);
    data.items = { deleteMany: {}, create: normalizedItems };
  }

  // Auto-generate invoice on approval (avoid duplicates)
  if (data.status === "aprovado" && quote.status !== "aprovado") {
    const invoiceNotes = `Gerado a partir do orçamento ${quote.number}`;
    const existing = await prisma.invoice.findFirst({
      where: { companyId: user.companyId, notes: invoiceNotes },
    });
    if (!existing) {
      const count = await prisma.invoice.count({ where: { companyId: user.companyId } });
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      const number = `FAT-${dateStr}-${String(count + 1).padStart(4, "0")}`;

      await prisma.invoice.create({
        data: {
          companyId: user.companyId,
          number,
          customer: quote.customer,
          total: data.total !== undefined ? data.total : quote.total,
          notes: invoiceNotes,
          items: {
            create: (Array.isArray(body.items) && data.total !== undefined ? (data.items.create as any[]) : quote.items).map((i) => ({
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

  await prisma.quote.update({ where: { id }, data });
  await logAction("update", "quote", id, `Orçamento atualizado`);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const result = await prisma.quote.deleteMany({ where: { id, companyId: user.companyId } });

  if (!result.count) return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
  return NextResponse.json({ success: true });
}
