import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const { customerName, items, paymentMethod } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 });
    }

    const total = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

    let customerId: string | undefined;
    if (customerName) {
      const customer = await prisma.customer.create({
        data: { name: customerName, companyId: user.companyId },
      });
      customerId = customer.id;
    }

    const sale = await prisma.sale.create({
      data: {
        companyId: user.companyId,
        total,
        status: "completed",
        paymentMethod: paymentMethod || "cash",
        customerId: customerId,
        notes: customerName && !customerId ? customerName : undefined,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
            total: item.price * item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          type: "out",
          quantity: item.quantity,
          notes: `Venda #${sale.id.slice(0, 8)}`,
        },
      });
    }

    return NextResponse.json({ sale }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao processar checkout." }, { status: 400 });
  }
}
