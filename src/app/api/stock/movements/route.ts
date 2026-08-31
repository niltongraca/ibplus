import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const productId = url.searchParams.get("productId");

  const movements = await prisma.stockMovement.findMany({
    where: {
      product: { companyId: user.companyId },
      ...(productId ? { productId } : {}),
    },
    include: { product: { select: { name: true, unit: true } } },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
  });

  return NextResponse.json({ movements });
}
