import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parsePagination, buildSearch, parseBool } from "@/lib/utils";
import { logAction } from "@/lib/audit";
import { toNumber } from "@/lib/money";
import { requireFeature, requireWrite } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { productSchema } from "@/lib/validations/products";

function serializeProduct(p: { price?: unknown; cost?: unknown } & Record<string, unknown>) {
  return { ...p, price: toNumber(p.price), cost: toNumber(p.cost) };
}

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireFeature(user, "produtos"); if (denied) return denied;

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
  };

  let products: Awaited<ReturnType<typeof prisma.product.findMany>>;
  let total: number;

  if (lowStock === true) {
    // Prisma não suporta comparar coluna com coluna num filtro; faz-se pós-leitura.
    const allProducts = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: "asc" },
    });
    const low = allProducts.filter((p) => p.stock <= p.minStock);
    total = low.length;
    products = all ? low : low.slice(skip, skip + limit);
  } else {
    [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { name: "asc" },
        ...(all ? {} : { skip, take: limit }),
      }),
      prisma.product.count({ where }),
    ]);
  }

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
  const denied = await requireWrite(user, "produtos"); if (denied) return denied;
  const companyId = user.companyId;

  try {
    const parsed = await parseBody(request, productSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;

    const nameTrimmed = body.name;
    const priceNum = body.price;
    const costNum = body.cost ?? 0;
    const stockNum = body.stock ?? 0;
    const minStockNum = body.minStock ?? 0;

    const catId = body.categoryId || null;
    if (catId) {
      const category = await prisma.category.findFirst({ where: { id: catId, companyId: user.companyId } });
      if (!category) return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: nameTrimmed,
          description: body.description || null,
          price: priceNum,
          cost: costNum,
          stock: stockNum,
          minStock: minStockNum,
          unit: body.unit || "un",
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

    await logAction("create", "product", product.id, `Produto "${product.name}" criado`, user);
    return NextResponse.json({ product: serializeProduct(product as never) }, { status: 201 });
  } catch (err) {
    console.error("Erro ao criar produto:", err);
    return NextResponse.json({ error: "Erro ao criar produto." }, { status: 400 });
  }
}
