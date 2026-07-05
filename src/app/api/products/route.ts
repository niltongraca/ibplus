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
    const data = await request.json();
    const product = await prisma.product.create({
      data: { ...data, companyId: user.companyId },
      include: { category: true },
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar produto." }, { status: 400 });
  }
}
