import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parsePagination } from "@/lib/utils";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const url = new URL(request.url);
  const { limit } = parsePagination(url.searchParams);
  const productId = url.searchParams.get("productId");

  const movements = await prisma.stockMovement.findMany({
    where: {
      product: { companyId: user.companyId },
      ...(productId ? { productId } : {}),
    },
    include: { product: { select: { name: true, unit: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ movements });
}
