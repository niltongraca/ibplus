import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { logAction } from "@/lib/audit";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where: { companyId: user.companyId },
      include: { customer: { select: { name: true } }, items: { include: { product: { select: { name: true } } } } },
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.sale.count({ where: { companyId: user.companyId } }),
  ]);

  return NextResponse.json({ sales, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const { customerId, items, paymentMethod, notes } = await request.json();

    const sale = await prisma.sale.create({
      data: {
        companyId: user.companyId,
        customerId,
        total: items.reduce((sum: number, i: { quantity: number; unitPrice: number }) => sum + i.quantity * i.unitPrice, 0),
        status: "completed",
        paymentMethod,
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
      include: { customer: { select: { name: true } }, items: true },
    });

    const customerName = sale.customer?.name || "Cliente";
    await logAction("create", "sale", sale.id, `Venda de ${sale.total.toLocaleString()} Kz - ${customerName}`);
    await createNotification(
      user.companyId, "sale", `Nova venda de ${sale.total.toLocaleString()} Kz`,
      `Venda registada para ${customerName}`, "/gestao/vendas"
    );

    return NextResponse.json({ sale }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar venda." }, { status: 400 });
  }
}
