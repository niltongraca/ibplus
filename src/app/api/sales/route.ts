import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parsePagination, buildSearch } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { logAction } from "@/lib/audit";
import { toNumber } from "@/lib/money";

function serializeSale(s: { total?: unknown; items: unknown[] } & Record<string, unknown>) {
  return {
    ...s,
    total: toNumber(s.total),
    items: s.items.map((it) => {
      const item = it as Record<string, unknown>;
      return { ...item, unitPrice: toNumber(item.unitPrice), total: toNumber(item.total) };
    }),
  };
}

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const url = new URL(request.url);
  const { page, limit, skip } = parsePagination(url.searchParams);
  const all = url.searchParams.get("all") === "true";
  const search = buildSearch(["customer.name"], url.searchParams.get("search"));
  const status = url.searchParams.get("status") ?? undefined;
  const where = {
    companyId: user.companyId,
    ...(search ?? {}),
    ...(status ? { status } : {}),
  };

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: { customer: { select: { name: true } }, items: { include: { product: { select: { name: true } } } } },
      orderBy: { date: "desc" },
      ...(all ? {} : { skip, take: limit }),
    }),
    prisma.sale.count({ where }),
  ]);

  return NextResponse.json({
    sales: sales.map((s) => serializeSale(s as never)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
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
      return { productId: i.productId, quantity: i.quantity };
    });

    const productIds = [...new Set(normalized.map((i) => i.productId))];
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, companyId: user.companyId } });
    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Um ou mais produtos são inválidos." }, { status: 400 });
    }
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const i of normalized) {
      const product = productMap.get(i.productId)!;
      if (product.stock < i.quantity) {
        return NextResponse.json({ error: `Stock insuficiente para "${product.name}".` }, { status: 400 });
      }
    }

    const total = normalized.reduce((sum, i) => sum + i.quantity * toNumber(productMap.get(i.productId)!.price), 0);

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
            create: normalized.map((i) => {
              const unitPrice = toNumber(productMap.get(i.productId)!.price);
              return {
                productId: i.productId,
                quantity: i.quantity,
                unitPrice,
                total: i.quantity * unitPrice,
              };
            }),
          },
        },
        include: { customer: { select: { name: true } }, items: true },
      });

      for (const i of normalized) {
        const decremented = await tx.product.updateMany({
          where: { id: i.productId, companyId: user.companyId!, stock: { gte: i.quantity } },
          data: { stock: { decrement: i.quantity } },
        });
        if (decremented.count === 0) {
          throw new Error(`INSUFFICIENT_STOCK:${productMap.get(i.productId)!.name}`);
        }
        await tx.stockMovement.create({
          data: {
            productId: i.productId,
            type: "OUT",
            quantity: i.quantity,
            notes: `Venda #${created.id}`,
          },
        });
      }

      return created;
    });

    const customerName = sale.customer?.name || "Cliente";
    await logAction("create", "sale", sale.id, `Venda de ${toNumber(sale.total).toLocaleString()} Kz - ${customerName}`);
    await createNotification(
      user.companyId, "sale", `Nova venda de ${toNumber(sale.total).toLocaleString()} Kz`,
      `Venda registada para ${customerName}`, "/gestao/vendas"
    );

    return NextResponse.json({ sale: serializeSale(sale as never) }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_ITEM") {
      return NextResponse.json({ error: "Cada item deve ter uma quantidade inteira positiva." }, { status: 400 });
    }
    if (err instanceof Error && err.message.startsWith("INSUFFICIENT_STOCK:")) {
      const name = err.message.slice("INSUFFICIENT_STOCK:".length);
      return NextResponse.json({ error: `Stock insuficiente para "${name}".` }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar venda." }, { status: 400 });
  }
}
