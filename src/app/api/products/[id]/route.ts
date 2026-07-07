import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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
  const data = await request.json();

  if (data.stockAdjust) {
    const product = await prisma.product.findFirst({ where: { id, companyId: user.companyId } });
    if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    const newStock = Math.max(0, product.stock + data.stockAdjust);
    await prisma.product.updateMany({ where: { id, companyId: user.companyId }, data: { stock: newStock } });
    return NextResponse.json({ success: true });
  }

  const product = await prisma.product.updateMany({
    where: { id, companyId: user.companyId },
    data,
  });

  if (!product.count) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.deleteMany({
    where: { id, companyId: user.companyId },
  });

  if (!product.count) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  return NextResponse.json({ success: true });
}
