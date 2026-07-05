import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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
  const data = await request.json();

  // If quote is approved, auto-generate invoice
  if (data.status === "aprovado") {
    const quote = await prisma.quote.findFirst({
      where: { id, companyId: user.companyId },
      include: { items: true },
    });
    if (quote) {
      const count = await prisma.invoice.count({ where: { companyId: user.companyId } });
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      const number = `FAT-${dateStr}-${String(count + 1).padStart(4, "0")}`;

      await prisma.invoice.create({
        data: {
          companyId: user.companyId,
          number,
          customer: quote.customer,
          total: quote.total,
          notes: `Gerado a partir do orçamento ${quote.number}`,
          items: {
            create: quote.items.map((i) => ({
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

  const result = await prisma.quote.updateMany({ where: { id, companyId: user.companyId }, data });

  if (!result.count) return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
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
