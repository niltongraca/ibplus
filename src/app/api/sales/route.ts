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
    const body = await request.json();
    const items = body.items as { productId: string; quantity: number; unitPrice?: number }[] | undefined;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "A venda deve conter pelo menos um item." }, { status: 400 });
    }

    const customerId: string | null = body.customerId || null;
    const paymentMethod: string | null = body.paymentMethod || null;
    const notes: string | null = body.notes || null;

    if (customerId) {
      const customer = await prisma.customer.findFirst({ where: { id: customerId, companyId: user.companyId } });
      if (!customer) return NextResponse.json({ error: "Cliente inválido." }, { status: 400 });
    }

    const normalized = items.map((i) => {
      if (!i.productId || !Number.isInteger(i.quantity) || i.quantity <= 0) {
        throw new Error("INVALID_ITEM");
      }
      return { productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice ?? 0 };
    });

    const productIds = [...new Set(normalized.map((i) => i.productId))];
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, companyId: user.companyId } });
    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Um ou mais produtos são inválidos." }, { status: 400 });
    }
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const i of normalized) {
      if (i.unitPrice <= 0) i.unitPrice = productMap.get(i.productId)!.price;
      const stock = productMap.get(i.productId)!.stock;
      if (stock < i.quantity) {
        return NextResponse.json({ error: `Stock insuficiente para "${productMap.get(i.productId)!.name}".` }, { status: 400 });
      }
    }

    const total = normalized.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          companyId: user.companyId!,
          customerId,
          total,
          status: "completed",
          paymentMethod,
          notes,
          items: {
            create: normalized.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              total: i.quantity * i.unitPrice,
            })),
          },
        },
        include: { customer: { select: { name: true } }, items: true },
      });

      for (const i of normalized) {
        const updated = await tx.product.update({
          where: { id: i.productId },
          data: { stock: { decrement: i.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: i.productId,
            type: "OUT",
            quantity: i.quantity,
            notes: `Venda #${created.id}`,
          },
        });
        void updated;
      }

      return created;
    });

    const customerName = sale.customer?.name || "Cliente";
    await logAction("create", "sale", sale.id, `Venda de ${sale.total.toLocaleString()} Kz - ${customerName}`);
    await createNotification(
      user.companyId, "sale", `Nova venda de ${sale.total.toLocaleString()} Kz`,
      `Venda registada para ${customerName}`, "/gestao/vendas"
    );

    return NextResponse.json({ sale }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_ITEM") {
      return NextResponse.json({ error: "Cada item deve ter uma quantidade inteira positiva." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar venda." }, { status: 400 });
  }
}
