import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { toNumber } from "@/lib/money";
import { requireFeature, requireWrite, requireDelete } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { saleUpdateSchema } from "@/lib/validations/finance";

function serializeSale(s: { total?: unknown; items: unknown[] } & Record<string, unknown>) {
  return {
    ...s,
    total: toNumber(s.total),
    items: s.items.map((it) => {
      const item = it as Record<string, unknown>;
      const serialized: Record<string, unknown> = { ...item, unitPrice: toNumber(item.unitPrice), total: toNumber(item.total) };
      const product = item.product as Record<string, unknown> | null | undefined;
      if (product && typeof product === "object") {
        serialized.product = { ...product, price: toNumber(product.price), cost: toNumber(product.cost) };
      }
      return serialized;
    }),
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireFeature(user, "vendas"); if (denied) return denied;

  const { id } = await params;
  const sale = await prisma.sale.findFirst({
    where: { id, companyId: user.companyId },
    include: { customer: true, items: { include: { product: true } } },
  });

  if (!sale) return NextResponse.json({ error: "Venda não encontrada." }, { status: 404 });
  return NextResponse.json({ sale: serializeSale(sale as never) });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireWrite(user, "vendas"); if (denied) return denied;

  const { id } = await params;
  const existing = await prisma.sale.findFirst({ where: { id, companyId: user.companyId }, include: { items: true } });
  if (!existing) return NextResponse.json({ error: "Venda não encontrada." }, { status: 404 });

  const parsed = await parseBody(request, saleUpdateSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  if (existing.status === "cancelled") {
    return NextResponse.json({ error: "A venda está cancelada e não pode ser editada." }, { status: 400 });
  }

  if (body.customerId !== undefined && body.customerId) {
    const customer = await prisma.customer.findFirst({ where: { id: body.customerId, companyId: user.companyId } });
    if (!customer) return NextResponse.json({ error: "Cliente inválido." }, { status: 400 });
  }

  try {
    if (body.items) {
      const normalized: { productId: string; quantity: number }[] = body.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));

      const productIds: string[] = [...new Set(normalized.map((i) => i.productId))];
      const products = await prisma.product.findMany({ where: { id: { in: productIds }, companyId: user.companyId } });
      if (products.length !== productIds.length) return NextResponse.json({ error: "Um ou mais produtos são inválidos." }, { status: 400 });
      const productMap = new Map(products.map((p) => [p.id, p]));

      const oldQty = new Map<string, number>();
      for (const old of existing.items) {
        if (old.productId) oldQty.set(old.productId, (oldQty.get(old.productId) || 0) + old.quantity);
      }
      const newQty = new Map<string, number>();
      for (const i of normalized) {
        newQty.set(i.productId, (newQty.get(i.productId) || 0) + i.quantity);
      }

      const allIds = [...new Set([...oldQty.keys(), ...newQty.keys()])];
      const allProducts = await prisma.product.findMany({ where: { id: { in: allIds }, companyId: user.companyId } });
      const allMap = new Map(allProducts.map((p) => [p.id, p]));

      for (const [pid, qty] of newQty) {
        const needed = qty - (oldQty.get(pid) || 0);
        if (needed > 0 && (allMap.get(pid)?.stock ?? 0) < needed) {
          return NextResponse.json({ error: `Stock insuficiente para "${allMap.get(pid)?.name}".` }, { status: 400 });
        }
      }

      const total = normalized.reduce((sum: number, i) => sum + i.quantity * toNumber(productMap.get(i.productId)!.price), 0);

      const sale = await prisma.$transaction(async (tx) => {
        await tx.saleItem.deleteMany({ where: { saleId: id } });

        for (const [pid, qty] of oldQty) {
          await tx.product.update({ where: { id: pid }, data: { stock: { increment: qty } } });
          await tx.stockMovement.create({ data: { productId: pid, type: "IN", quantity: qty, notes: `Reposição ao editar venda #${id}` } });
        }
        for (const [pid, qty] of newQty) {
          const decremented = await tx.product.updateMany({
            where: { id: pid, companyId: user.companyId!, stock: { gte: qty } },
            data: { stock: { decrement: qty } },
          });
          if (decremented.count === 0) {
            throw new Error(`INSUFFICIENT_STOCK:${allMap.get(pid)?.name || ""}`);
          }
          await tx.stockMovement.create({ data: { productId: pid, type: "OUT", quantity: qty, notes: `Venda #${id} (edição)` } });
        }

        return tx.sale.update({
          where: { id },
          data: {
            total,
            status: body.status ?? existing.status,
            paymentMethod: body.paymentMethod ?? existing.paymentMethod,
            notes: body.notes ?? existing.notes,
            customerId: body.customerId !== undefined ? body.customerId || null : existing.customerId,
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
          include: { customer: { select: { name: true } }, items: { include: { product: { select: { name: true } } } } },
        });
      });

      await logAction("update", "sale", id, `Venda atualizada - ${toNumber(sale.total).toLocaleString()} Kz`, user);
      return NextResponse.json({ sale: serializeSale(sale as never) });
    }

    const updateData: Prisma.SaleUpdateInput = {};
    if (body.customerId !== undefined) {
      updateData.customer = body.customerId ? { connect: { id: body.customerId } } : { disconnect: true };
    }
    if (body.status !== undefined) updateData.status = body.status;
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;
    if (body.notes !== undefined) updateData.notes = body.notes;

    if (Object.keys(updateData).length > 0) {
      await prisma.sale.update({ where: { id }, data: updateData });
    }
    const sale = await prisma.sale.findFirst({
      where: { id, companyId: user.companyId },
      include: { customer: { select: { name: true } }, items: { include: { product: { select: { name: true } } } } },
    });
    await logAction("update", "sale", id, `Venda atualizada`, user);
    return NextResponse.json({ sale: serializeSale(sale as never) });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_ITEM") {
      return NextResponse.json({ error: "Cada item deve ter uma quantidade inteira positiva." }, { status: 400 });
    }
    if (err instanceof Error && err.message.startsWith("INSUFFICIENT_STOCK:")) {
      const name = err.message.slice("INSUFFICIENT_STOCK:".length);
      return NextResponse.json({ error: `Stock insuficiente para "${name}".` }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar venda." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireDelete(user, "vendas"); if (denied) return denied;

  const { id } = await params;
  const existing = await prisma.sale.findFirst({
    where: { id, companyId: user.companyId },
    include: { items: true },
  });
  if (!existing) return NextResponse.json({ error: "Venda não encontrada." }, { status: 404 });

  if (existing.status === "cancelled") {
    return NextResponse.json({ error: "A venda já está cancelada." }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const res = await tx.sale.updateMany({ where: { id, status: "completed" }, data: { status: "cancelled" } });
      if (res.count === 0) throw new Error("SALE_ALREADY_CANCELLED");
      for (const item of existing.items) {
        if (!item.productId) continue;
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        await tx.stockMovement.create({
          data: { productId: item.productId, type: "IN", quantity: item.quantity, notes: `Reposição ao cancelar venda #${id}` },
        });
      }
    });
  } catch (err) {
    if (err instanceof Error && err.message === "SALE_ALREADY_CANCELLED") {
      return NextResponse.json({ error: "A venda já está cancelada." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao cancelar venda." }, { status: 400 });
  }

  await logAction("delete", "sale", id, `Venda cancelada`, user);
  return NextResponse.json({ success: true, message: "Venda cancelada e stock reposto." });
}
