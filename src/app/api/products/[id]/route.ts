import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, companyId: user.companyId },
    include: { category: true },
  });

  if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.product.findFirst({ where: { id, companyId: user.companyId } });
  if (!existing) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });

  const data = await request.json();

  if ("stockAdjust" in data) {
    const adjust = Number(data.stockAdjust);
    if (!Number.isInteger(adjust) || adjust === 0) {
      return NextResponse.json({ error: "O ajuste de stock deve ser um número inteiro diferente de zero." }, { status: 400 });
    }
    const newStock = existing.stock + adjust;
    if (newStock < 0) {
      return NextResponse.json({ error: "O stock não pode ficar negativo." }, { status: 400 });
    }

    const { stockAdjust, ...rest } = data;
    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: { stock: newStock } });
      await tx.stockMovement.create({
        data: { productId: id, type: adjust > 0 ? "IN" : "OUT", quantity: Math.abs(adjust), notes: rest.notes || "Ajuste manual" },
      });
    });

    await logAction("update", "product", id, `Stock de "${existing.name}" ajustado em ${adjust > 0 ? "+" : ""}${adjust}`);
    return NextResponse.json({ success: true, stock: newStock });
  }

  const { name, description, price, cost, stock, minStock, unit, categoryId } = data;

  const nameTrimmed = name !== undefined ? (typeof name === "string" ? name.trim() : name) : existing.name;
  if (typeof nameTrimmed === "string" && !nameTrimmed) return NextResponse.json({ error: "O nome não pode ficar vazio." }, { status: 400 });

  const catId = categoryId === undefined ? existing.categoryId : (categoryId || null);
  if (catId) {
    const category = await prisma.category.findFirst({ where: { id: catId, companyId: user.companyId } });
    if (!category) return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  const parsed: Record<string, any> = {};
  if (price !== undefined) {
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) return NextResponse.json({ error: "O preço deve ser um número positivo." }, { status: 400 });
    parsed.price = priceNum;
  }
  if (cost !== undefined) {
    const costNum = Number(cost);
    if (!Number.isFinite(costNum) || costNum < 0) return NextResponse.json({ error: "O custo não pode ser negativo." }, { status: 400 });
    parsed.cost = costNum;
  }
  if (stock !== undefined) {
    const stockNum = Number(stock);
    if (!Number.isInteger(stockNum) || stockNum < 0) return NextResponse.json({ error: "O stock deve ser um número inteiro não negativo." }, { status: 400 });
    parsed.stock = stockNum;
  }
  if (minStock !== undefined) {
    const minStockNum = Number(minStock);
    if (!Number.isInteger(minStockNum) || minStockNum < 0) return NextResponse.json({ error: "O stock mínimo deve ser um número inteiro não negativo." }, { status: 400 });
    parsed.minStock = minStockNum;
  }
  if (unit !== undefined) parsed.unit = unit || "un";

  const result = await prisma.product.updateMany({
    where: { id, companyId: user.companyId },
    data: {
      ...(name !== undefined ? { name: nameTrimmed } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(categoryId !== undefined ? { categoryId: catId } : {}),
      ...parsed,
    },
  });

  if (!result.count) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  await logAction("update", "product", id, `Produto "${nameTrimmed || existing.name}" atualizado`);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, companyId: user.companyId },
    include: { _count: { select: { saleItems: true, purchaseItems: true, stockMovements: true } } },
  });
  if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });

  const hasHistory = product._count.saleItems > 0 || product._count.purchaseItems > 0 || product._count.stockMovements > 0;

  if (hasHistory) {
    await prisma.product.update({ where: { id }, data: { active: false } });
    await logAction("delete", "product", id, `Produto "${product.name}" desativado (tem histórico)`);
    return NextResponse.json({ success: true, message: "Produto desativado porque tem histórico." });
  }

  await prisma.product.delete({ where: { id } });
  await logAction("delete", "product", id, `Produto "${product.name}" eliminado`);
  return NextResponse.json({ success: true });
}
