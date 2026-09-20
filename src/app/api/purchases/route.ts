import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parsePagination, buildSearch } from "@/lib/utils";
import { toNumber } from "@/lib/money";
import { requireFeature, requireWrite } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { purchaseCreateSchema } from "@/lib/validations/finance";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireFeature(user, "compras"); if (denied) return denied;

  const url = new URL(request.url);
  const { page, limit, skip } = parsePagination(url.searchParams);
  const search = buildSearch(["supplier", "invoiceNumber"], url.searchParams.get("search"));
  const status = url.searchParams.get("status") ?? undefined;
  const where = {
    companyId: user.companyId,
    ...(search ?? {}),
    ...(status ? { status } : {}),
  };

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: { items: { include: { product: { select: { name: true } } } } },
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.purchase.count({ where }),
  ]);

  return NextResponse.json({
    purchases: purchases.map((p) => ({
      ...p,
      total: toNumber(p.total),
      items: p.items.map((it) => ({ ...it, unitPrice: toNumber(it.unitPrice), total: toNumber(it.total) })),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireWrite(user, "compras"); if (denied) return denied;

  try {
    const parsed = await parseBody(request, purchaseCreateSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;
    const items = body.items;
    const supplier = body.supplier || null;
    const notes = body.notes || null;

    const normalized = items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.unitPrice ?? 0,
    }));

    const productIds = [...new Set(normalized.map((i) => i.productId))];
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, companyId: user.companyId } });
    if (products.length !== productIds.length) return NextResponse.json({ error: "Um ou mais produtos são inválidos." }, { status: 400 });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const i of normalized) {
      if (i.unitPrice <= 0) i.unitPrice = toNumber(productMap.get(i.productId)!.price);
    }

    const total = normalized.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    const purchase = await prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          companyId: user.companyId!,
          supplier,
          total,
          status: "completed",
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
        include: { items: true },
      });

      for (const i of normalized) {
        await tx.product.update({ where: { id: i.productId }, data: { stock: { increment: i.quantity } } });
        await tx.stockMovement.create({
          data: { productId: i.productId, type: "IN", quantity: i.quantity, notes: `Compra #${created.id}` },
        });
      }

      return created;
    });

    return NextResponse.json({
      purchase: {
        ...purchase,
        total: toNumber(purchase.total),
        items: purchase.items.map((it) => ({ ...it, unitPrice: toNumber(it.unitPrice), total: toNumber(it.total) })),
      },
    }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_ITEM") {
      return NextResponse.json({ error: "Cada item deve ter uma quantidade inteira positiva." }, { status: 400 });
    }
    if (err instanceof Error && err.message === "INVALID_PRICE") {
      return NextResponse.json({ error: "O preço unitário deve ser um número não negativo." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar compra." }, { status: 400 });
  }
}
