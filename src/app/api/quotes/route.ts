import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const quotes = await prisma.quote.findMany({
    where: { companyId: user.companyId },
    include: { items: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ quotes });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const { customer, validUntil, notes, items } = await request.json();

    const count = await prisma.quote.count({ where: { companyId: user.companyId } });
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const number = `ORC-${dateStr}-${String(count + 1).padStart(4, "0")}`;

    const quote = await prisma.quote.create({
      data: {
        companyId: user.companyId,
        number,
        customer,
        validUntil: validUntil ? new Date(validUntil) : null,
        total: items.reduce((sum: number, i: { quantity: number; unitPrice: number }) => sum + i.quantity * i.unitPrice, 0),
        notes,
        items: {
          create: items.map((i: { description: string; quantity: number; unitPrice: number }) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: i.quantity * i.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ quote }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar orçamento." }, { status: 400 });
  }
}
