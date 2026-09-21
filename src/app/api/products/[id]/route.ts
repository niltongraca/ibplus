import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { toNumber } from "@/lib/money";
import { requireFeature, requireWrite, requireDelete } from "@/lib/permissions";
import { validateSchema } from "@/lib/validations/helpers";
import { productUpdateSchema, productStockAdjustSchema } from "@/lib/validations/catalog";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireFeature(user, "produtos"); if (denied) return denied;

  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, companyId: user.companyId },
    include: { category: true },
  });

  if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  return NextResponse.json({ product: { ...product, price: toNumber(product.price), cost: toNumber(product.cost) } });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireWrite(user, "produtos"); if (denied) return denied;
  const companyId = user.companyId;

  const { id } = await params;
  const existing = await prisma.product.findFirst({ where: { id, companyId: user.companyId } });
  if (!existing) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });

  const body = await request.json();

  if ("stockAdjust" in body) {
    const parsedAdj = validateSchema(productStockAdjustSchema, body);
    if ("error" in parsedAdj) return parsedAdj.error;
    const adj = parsedAdj.data;

    const adjust = adj.stockAdjust;
    try {
      await prisma.$transaction(async (tx) => {
        const where = adjust < 0 ? { id, companyId, stock: { gte: Math.abs(adjust) } } : { id, companyId };
        const result = await tx.product.updateMany({ where, data: { stock: { increment: adjust } } });
        if (result.count === 0) throw new Error("STOCK_NEGATIVE");
        await tx.stockMovement.create({
          data: { productId: id, type: adjust > 0 ? "IN" : "OUT", quantity: Math.abs(adjust), notes: adj.notes || "Ajuste manual" },
        });
      });
    } catch (err) {
      if (err instanceof Error && err.message === "STOCK_NEGATIVE") {
        return NextResponse.json({ error: "O stock não pode ficar negativo." }, { status: 400 });
      }
      return NextResponse.json({ error: "Erro ao ajustar o stock." }, { status: 400 });
    }

    const newStock = await prisma.product.findFirst({ where: { id }, select: { stock: true } });
    await logAction("update", "product", id, `Stock de "${existing.name}" ajustado em ${adjust > 0 ? "+" : ""}${adjust}`, user);
    return NextResponse.json({ success: true, stock: newStock?.stock });
  }

  const parsed = validateSchema(productUpdateSchema, body);
  if ("error" in parsed) return parsed.error;
  const data = parsed.data;

  const nameTrimmed = data.name ?? existing.name;

  const catId = data.categoryId === undefined ? existing.categoryId : (data.categoryId || null);
  if (catId) {
    const category = await prisma.category.findFirst({ where: { id: catId, companyId: user.companyId } });
    if (!category) return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  const parsedData: Prisma.ProductUncheckedUpdateInput = {};
  if (data.price !== undefined) {
    parsedData.price = data.price;
  }
  if (data.cost !== undefined) {
    parsedData.cost = data.cost ?? 0;
  }
  if (data.stock !== undefined) {
    parsedData.stock = data.stock ?? 0;
  }
  if (data.minStock !== undefined) {
    parsedData.minStock = data.minStock ?? 0;
  }
  if (data.unit !== undefined) parsedData.unit = data.unit || "un";

  const result = await prisma.product.updateMany({
    where: { id, companyId: user.companyId },
    data: {
      ...(data.name !== undefined ? { name: nameTrimmed } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.categoryId !== undefined ? { categoryId: catId } : {}),
      ...parsedData,
    },
  });

  if (!result.count) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  await logAction("update", "product", id, `Produto "${nameTrimmed || existing.name}" atualizado`, user);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireDelete(user, "produtos"); if (denied) return denied;

  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, companyId: user.companyId },
    include: { _count: { select: { saleItems: true, purchaseItems: true, stockMovements: true } } },
  });
  if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });

  const hasHistory = product._count.saleItems > 0 || product._count.purchaseItems > 0 || product._count.stockMovements > 0;

  if (hasHistory) {
    await prisma.product.update({ where: { id }, data: { active: false } });
    await logAction("delete", "product", id, `Produto "${product.name}" desativado (tem histórico)`, user);
    return NextResponse.json({ success: true, message: "Produto desativado porque tem histórico." });
  }

  await prisma.product.delete({ where: { id } });
  await logAction("delete", "product", id, `Produto "${product.name}" eliminado`, user);
  return NextResponse.json({ success: true });
}
