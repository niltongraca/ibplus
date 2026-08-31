import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const purchase = await prisma.purchase.findFirst({
    where: { id, companyId: user.companyId },
    include: { items: { include: { product: { select: { name: true } } } } },
  });

  if (!purchase) return NextResponse.json({ error: "Compra não encontrada." }, { status: 404 });
  return NextResponse.json({ purchase });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const data = await request.json();

  const existing = await prisma.purchase.findFirst({
    where: { id, companyId: user.companyId },
    include: { items: true },
  });
  if (!existing) return NextResponse.json({ error: "Compra não encontrada." }, { status: 404 });

  // If only simple fields are being updated (no items), do a plain update.
  if (!data.items) {
    const { supplier, status, notes } = data;
    const purchase = await prisma.purchase.update({
      where: { id },
      data: {
        supplier: supplier !== undefined ? (supplier || null) : existing.supplier,
        status: status !== undefined ? status : existing.status,
        notes: notes !== undefined ? (notes || null) : existing.notes,
      },
      include: { items: true },
    });
    await logAction("update", "purchase", id, `Compra atualizada - ${purchase.total.toLocaleString()} Kz`);
    return NextResponse.json({ purchase });
  }

  try {
    const items = data.items as { productId: string; quantity: number; unitPrice?: number }[];
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "A compra deve conter pelo menos um item." }, { status: 400 });
    }

    const normalized: { productId: string; quantity: number; unitPrice: number }[] = items.map((i) => {
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

    const oldQty = new Map<string, number>();
    for (const old of existing.items) {
      if (old.productId) oldQty.set(old.productId, (oldQty.get(old.productId) || 0) + old.quantity);
    }
    const newQty = new Map<string, number>();
    for (const i of normalized) newQty.set(i.productId, (newQty.get(i.productId) || 0) + i.quantity);

    const total = normalized.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    const purchase = await prisma.$transaction(async (tx) => {
      await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });

      for (const [pid, qty] of oldQty) {
        await tx.product.update({ where: { id: pid }, data: { stock: { decrement: qty } } });
        await tx.stockMovement.create({ data: { productId: pid, type: "OUT", quantity: qty, notes: `Anulação de stock ao editar compra #${id}` } });
      }
      for (const [pid, qty] of newQty) {
        await tx.product.update({ where: { id: pid }, data: { stock: { increment: qty } } });
        await tx.stockMovement.create({ data: { productId: pid, type: "IN", quantity: qty, notes: `Compra #${id} (edição)` } });
      }

      return tx.purchase.update({
        where: { id },
        data: {
          supplier: data.supplier !== undefined ? (data.supplier || null) : existing.supplier,
          status: data.status !== undefined ? data.status : existing.status,
          notes: data.notes !== undefined ? (data.notes || null) : existing.notes,
          total,
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
    });

    await logAction("update", "purchase", id, `Compra atualizada - ${purchase.total.toLocaleString()} Kz`);
    return NextResponse.json({ purchase });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_ITEM") {
      return NextResponse.json({ error: "Cada item deve ter uma quantidade inteira positiva." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar compra." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.purchase.findFirst({
    where: { id, companyId: user.companyId },
    include: { items: true },
  });
  if (!existing) return NextResponse.json({ error: "Compra não encontrada." }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    for (const item of existing.items) {
      if (!item.productId || existing.status !== "completed") continue;
      await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      await tx.stockMovement.create({
        data: { productId: item.productId, type: "OUT", quantity: item.quantity, notes: `Anulação da compra #${id}` },
      });
    }
    await tx.purchase.delete({ where: { id } });
  });

  await logAction("delete", "purchase", id, `Compra eliminada`);
  return NextResponse.json({ success: true });
}
