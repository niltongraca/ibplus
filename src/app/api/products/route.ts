import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { companyId: user.companyId },
      include: { category: true },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where: { companyId: user.companyId } }),
  ]);

  return NextResponse.json({ products, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const body = await request.json();
    const { name, description, price, cost, stock, minStock, unit, categoryId } = body;

    const nameTrimmed = typeof name === "string" ? name.trim() : "";
    if (!nameTrimmed || price === undefined || price === null || price === "") {
      return NextResponse.json({ error: "Nome e preço são obrigatórios." }, { status: 400 });
    }

    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return NextResponse.json({ error: "O preço deve ser um número positivo." }, { status: 400 });
    }

    const costNum = cost === undefined || cost === null || cost === "" ? 0 : Number(cost);
    if (!Number.isFinite(costNum) || costNum < 0) {
      return NextResponse.json({ error: "O custo não pode ser negativo." }, { status: 400 });
    }

    const stockNum = stock === undefined || stock === null || stock === "" ? 0 : Number(stock);
    const minStockNum = minStock === undefined || minStock === null || minStock === "" ? 0 : Number(minStock);
    if (!Number.isInteger(stockNum) || stockNum < 0) return NextResponse.json({ error: "O stock deve ser um número inteiro não negativo." }, { status: 400 });
    if (!Number.isInteger(minStockNum) || minStockNum < 0) return NextResponse.json({ error: "O stock mínimo deve ser um número inteiro não negativo." }, { status: 400 });

    const catId = categoryId || null;
    if (catId) {
      const category = await prisma.category.findFirst({ where: { id: catId, companyId: user.companyId } });
      if (!category) return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name: nameTrimmed,
        description: description || null,
        price: priceNum,
        cost: costNum,
        stock: stockNum,
        minStock: minStockNum,
        unit: unit || "un",
        categoryId: catId,
        companyId: user.companyId,
      },
      include: { category: true },
    });

    if (stockNum > 0) {
      await prisma.stockMovement.create({
        data: { productId: product.id, type: "IN", quantity: stockNum, notes: "Stock inicial" },
      });
    }

    await logAction("create", "product", product.id, `Produto "${product.name}" criado`);
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error("Erro ao criar produto:", err);
    return NextResponse.json({ error: "Erro ao criar produto." }, { status: 400 });
  }
}
