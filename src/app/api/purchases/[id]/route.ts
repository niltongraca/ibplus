import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const purchase = await prisma.purchase.findFirst({
    where: { id, companyId: user.companyId },
    include: { items: { include: { product: { select: { name: true } } } } },
  });

  if (!purchase) return NextResponse.json({ error: "Compra não encontrada." }, { status: 404 });
  return NextResponse.json({ purchase });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const data = await request.json();

  const existing = await prisma.purchase.findFirst({ where: { id, companyId: user.companyId } });
  if (!existing) return NextResponse.json({ error: "Compra não encontrada." }, { status: 404 });

  try {
    if (data.items) {
      await prisma.purchaseItem.deleteMany({ where: { purchaseId: id } });
    }

    const purchase = await prisma.purchase.update({
      where: { id },
      data: {
        supplier: data.supplier ?? existing.supplier,
        status: data.status ?? existing.status,
        notes: data.notes ?? existing.notes,
        ...(data.items && {
          total: data.items.reduce((sum: number, i: { quantity: number; unitPrice: number }) => sum + i.quantity * i.unitPrice, 0),
          items: {
            create: data.items.map((i: { productId: string; quantity: number; unitPrice: number }) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              total: i.quantity * i.unitPrice,
            })),
          },
        }),
      },
      include: { items: true },
    });

    await logAction("update", "purchase", id, `Compra atualizada - ${purchase.total.toLocaleString()} Kz`);
    return NextResponse.json({ purchase });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar compra." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.purchase.findFirst({ where: { id, companyId: user.companyId } });
  if (!existing) return NextResponse.json({ error: "Compra não encontrada." }, { status: 404 });

  await prisma.purchaseItem.deleteMany({ where: { purchaseId: id } });
  await prisma.purchase.delete({ where: { id } });
  await logAction("delete", "purchase", id, `Compra eliminada`);

  return NextResponse.json({ success: true });
}
