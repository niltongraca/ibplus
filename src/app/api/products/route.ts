import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parsePagination, buildSearch, parseBool } from "@/lib/utils";
import { logAction } from "@/lib/audit";
import { toNumber } from "@/lib/money";

function serializeProduct(p: { price?: unknown; cost?: unknown } & Record<string, unknown>) {
  return { ...p, price: toNumber(p.price), cost: toNumber(p.cost) };
}

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const url = new URL(request.url);
  const { page, limit, skip } = parsePagination(url.searchParams);
  const all = url.searchParams.get("all") === "true";
  const search = buildSearch(["name", "description"], url.searchParams.get("search"));
  const categoryId = url.searchParams.get("categoryId") ?? undefined;
  const active = parseBool(url.searchParams.get("active"));
  const lowStock = parseBool(url.searchParams.get("lowStock"));
  const where = {
    companyId: user.companyId,
    ...(search ?? {}),
    ...(categoryId ? { categoryId } : {}),
    ...(active !== undefined ? { active } : {}),
    ...(lowStock !== undefined ? { stock: { lte: prisma.product.fields.minStock } } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: "asc" },
      ...(all ? {} : { skip, take: limit }),
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    products: products.map((p) => serializeProduct(p as never)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const companyId = user.companyId;

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

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: nameTrimmed,
          description: description || null,
          price: priceNum,
          cost: costNum,
          stock: stockNum,
          minStock: minStockNum,
          unit: unit || "un",
          categoryId: catId,
          companyId,
        },
        include: { category: true },
      });

      if (stockNum > 0) {
        await tx.stockMovement.create({
          data: { productId: created.id, type: "IN", quantity: stockNum, notes: "Stock inicial" },
        });
      }

      return created;
    });

    await logAction("create", "product", product.id, `Produto "${product.name}" criado`);
    return NextResponse.json({ product: serializeProduct(product as never) }, { status: 201 });
  } catch (err) {
    console.error("Erro ao criar produto:", err);
    return NextResponse.json({ error: "Erro ao criar produto." }, { status: 400 });
  }
}
