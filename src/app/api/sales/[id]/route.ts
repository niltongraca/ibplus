import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const sale = await prisma.sale.findFirst({
    where: { id, companyId: user.companyId },
    include: { customer: true, items: { include: { product: true } } },
  });

  if (!sale) return NextResponse.json({ error: "Venda não encontrada." }, { status: 404 });
  return NextResponse.json({ sale });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.sale.findFirst({ where: { id, companyId: user.companyId }, include: { items: true } });
  if (!existing) return NextResponse.json({ error: "Venda não encontrada." }, { status: 404 });

  const body = await request.json();

  if (existing.status === "cancelled") {
    return NextResponse.json({ error: "A venda está cancelada e não pode ser editada." }, { status: 400 });
  }

  const promises: Promise<unknown>[] = [];
  if (body.customerId !== undefined) {
    if (body.customerId) {
      const customer = await prisma.customer.findFirst({ where: { id: body.customerId, companyId: user.companyId } });
      if (!customer) return NextResponse.json({ error: "Cliente inválido." }, { status: 400 });
    }
    promises.push(prisma.sale.update({ where: { id }, data: { customerId: body.customerId } }));
  }

  try {
    if (body.items) {
      if (!Array.isArray(body.items) || body.items.length === 0) {
        return NextResponse.json({ error: "A venda deve conter pelo menos um item." }, { status: 400 });
      }

      const normalized: { productId: string; quantity: number; unitPrice: number }[] = body.items.map((i: { productId: string; quantity: number; unitPrice?: number }) => {
        if (!i.productId || !Number.isInteger(i.quantity) || i.quantity <= 0) throw new Error("INVALID_ITEM");
        return { productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice ?? 0 };
      });

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
        if (i.unitPrice <= 0) i.unitPrice = productMap.get(i.productId)!.price;
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

      const total = normalized.reduce((sum: number, i: any) => sum + i.quantity * i.unitPrice, 0);

      const sale = await prisma.$transaction(async (tx) => {
        await tx.saleItem.deleteMany({ where: { saleId: id } });

        for (const [pid, qty] of oldQty) {
          await tx.product.update({ where: { id: pid }, data: { stock: { increment: qty } } });
          await tx.stockMovement.create({ data: { productId: pid, type: "IN", quantity: qty, notes: `Reposição ao editar venda #${id}` } });
        }
        for (const [pid, qty] of newQty) {
          await tx.product.update({ where: { id: pid }, data: { stock: { decrement: qty } } });
          await tx.stockMovement.create({ data: { productId: pid, type: "OUT", quantity: qty, notes: `Venda #${id} (edição)` } });
        }

        return tx.sale.update({
          where: { id },
          data: {
            total,
            status: body.status ?? existing.status,
            paymentMethod: body.paymentMethod ?? existing.paymentMethod,
            notes: body.notes ?? existing.notes,
            items: {
              create: normalized.map((i: any) => ({
                productId: i.productId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                total: i.quantity * i.unitPrice,
              })),
            },
          },
          include: { customer: { select: { name: true } }, items: { include: { product: { select: { name: true } } } } },
        });
      });

      await logAction("update", "sale", id, `Venda atualizada - ${sale.total.toLocaleString()} Kz`);
      return NextResponse.json({ sale });
    }

    if (body.status !== undefined) {
      promises.push(
        prisma.sale.update({ where: { id }, data: { status: body.status } })
      );
    }
    if (body.paymentMethod !== undefined) {
      promises.push(prisma.sale.update({ where: { id }, data: { paymentMethod: body.paymentMethod } }));
    }
    if (body.notes !== undefined) {
      promises.push(prisma.sale.update({ where: { id }, data: { notes: body.notes } }));
    }

    await Promise.all(promises);
    const sale = await prisma.sale.findFirst({
      where: { id, companyId: user.companyId },
      include: { customer: { select: { name: true } }, items: { include: { product: { select: { name: true } } } } },
    });
    await logAction("update", "sale", id, `Venda atualizada`);
    return NextResponse.json({ sale });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_ITEM") {
      return NextResponse.json({ error: "Cada item deve ter uma quantidade inteira positiva." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar venda." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.sale.findFirst({
    where: { id, companyId: user.companyId },
    include: { items: true },
  });
  if (!existing) return NextResponse.json({ error: "Venda não encontrada." }, { status: 404 });

  if (existing.status === "cancelled") {
    return NextResponse.json({ error: "A venda já está cancelada." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    for (const item of existing.items) {
      if (!item.productId) continue;
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      await tx.stockMovement.create({
        data: { productId: item.productId, type: "IN", quantity: item.quantity, notes: `Reposição ao cancelar venda #${id}` },
      });
    }
    await tx.sale.update({ where: { id }, data: { status: "cancelled" } });
  });

  await logAction("delete", "sale", id, `Venda cancelada`);
  return NextResponse.json({ success: true, message: "Venda cancelada e stock reposto." });
}
