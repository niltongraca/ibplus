import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const purchases = await prisma.purchase.findMany({
    where: { companyId: user.companyId },
    include: { items: { include: { product: { select: { name: true } } } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ purchases });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const { supplier, items, notes } = await request.json();

    const purchase = await prisma.purchase.create({
      data: {
        companyId: user.companyId,
        supplier,
        total: items.reduce((sum: number, i: { quantity: number; unitPrice: number }) => sum + i.quantity * i.unitPrice, 0),
        status: "completed",
        notes,
        items: {
          create: items.map((i: { productId: string; quantity: number; unitPrice: number }) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: i.quantity * i.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ purchase }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar compra." }, { status: 400 });
  }
}
