import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { companyId: user.companyId },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const { name, description, price, cost, stock, minStock, unit, categoryId } = await request.json();

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Nome e preço são obrigatórios." }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        cost: parseFloat(cost) || 0,
        stock: parseInt(stock) || 0,
        minStock: parseInt(minStock) || 0,
        unit: unit || "un",
        categoryId: categoryId || null,
        companyId: user.companyId,
      },
      include: { category: true },
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar produto." }, { status: 400 });
  }
}
