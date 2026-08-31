import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where: { companyId: user.companyId },
      include: { items: { include: { product: { select: { name: true } } } } },
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.purchase.count({ where: { companyId: user.companyId } }),
  ]);

  return NextResponse.json({ purchases, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const body = await request.json();
    const items = body.items as { productId: string; quantity: number; unitPrice?: number }[] | undefined;
    const supplier = body.supplier ? String(body.supplier).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : null;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "A compra deve conter pelo menos um item." }, { status: 400 });
    }

    const normalized = items.map((i) => {
      if (!i.productId || !Number.isInteger(i.quantity) || i.quantity <= 0) throw new Error("INVALID_ITEM");
      return { productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice ?? 0 };
    });

    const productIds = [...new Set(normalized.map((i) => i.productId))];
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, companyId: user.companyId } });
    if (products.length !== productIds.length) return NextResponse.json({ error: "Um ou mais produtos são inválidos." }, { status: 400 });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const i of normalized) {
      if (i.unitPrice <= 0) i.unitPrice = productMap.get(i.productId)!.price;
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

    return NextResponse.json({ purchase }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_ITEM") {
      return NextResponse.json({ error: "Cada item deve ter uma quantidade inteira positiva." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar compra." }, { status: 400 });
  }
}
