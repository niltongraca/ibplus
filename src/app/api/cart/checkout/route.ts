import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { toNumber } from "@/lib/money";

const PAYMENT_METHODS = ["cash", "card", "transfer", "multicaixa"];

type CartItem = { productId: string; quantity: number };

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const companyId = user.companyId as string;

  try {
    const body = await request.json();
    const customerName = body.customerName ? String(body.customerName).trim() : "";
    const paymentMethod = typeof body.paymentMethod === "string" && PAYMENT_METHODS.includes(body.paymentMethod) ? body.paymentMethod : "cash";

    const items: CartItem[] = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 });

    const productIds = items.map((item) => item.productId);
    if (productIds.some((id) => typeof id !== "string" || !id)) {
      return NextResponse.json({ error: "Produto inválido no carrinho." }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, companyId: companyId },
      select: { id: true, name: true, stock: true, price: true },
    });

    if (products.length !== new Set(productIds).size) {
      return NextResponse.json({ error: "Um ou mais produtos não foram encontrados." }, { status: 400 });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) return NextResponse.json({ error: "Produto inválido." }, { status: 400 });
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json({ error: "Quantidade inválida." }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Stock insuficiente para "${product.name}".` }, { status: 400 });
      }
    }

    // Total always computed from the server-side price (never trust client-sent price)
    const total = items.reduce(
      (sum: number, item) => sum + toNumber(productMap.get(item.productId)!.price) * item.quantity,
      0
    );

    const sale = await prisma.$transaction(async (tx) => {
      let customerId: string | undefined;
      if (customerName) {
        const customer = await tx.customer.create({
          data: { name: customerName, companyId: companyId },
        });
        customerId = customer.id;
      }

      const created = await tx.sale.create({
        data: {
          companyId: companyId,
          total,
          status: "completed",
          paymentMethod,
          customerId: customerId,
          notes: customerName && !customerId ? customerName : undefined,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: toNumber(productMap.get(item.productId)!.price),
              total: toNumber(productMap.get(item.productId)!.price) * item.quantity,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of items) {
        const decremented = await tx.product.updateMany({
          where: { id: item.productId, companyId: companyId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (decremented.count === 0) {
          throw new Error(`Stock insuficiente para "${productMap.get(item.productId)!.name}".`);
        }
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "out",
            quantity: item.quantity,
            notes: `Venda #${created.id.slice(0, 8)}`,
          },
        });
      }

      return created;
    });

    await logAction("create", "sale", sale.id, `Venda na loja no valor de ${Math.round(total * 100) / 100} Kz`);
    return NextResponse.json({ sale }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const error = /Carrinho|Produto|Quantidade|Stock|encontrados/.test(message) ? message : "Erro ao processar checkout.";
    return NextResponse.json({ error }, { status: 400 });
  }
}
