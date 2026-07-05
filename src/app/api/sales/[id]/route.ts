import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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
