import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/money";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      products: {
        where: { active: true },
        include: { category: { select: { name: true } } },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!company) return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
  return NextResponse.json({
    company: {
      ...company,
      products: company.products.map((p) => ({ ...p, price: toNumber(p.price), cost: toNumber(p.cost) })),
    },
  });
}
