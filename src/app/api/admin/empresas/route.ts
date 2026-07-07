import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

    const empresas = await prisma.user.findMany({
      where: { accountType: "EMPRESA" },
      include: {
        company: { select: { id: true, name: true, nif: true, email: true } },
        companyProfile: { select: { nomeEmpresa: true, nif: true, registoComercial: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const companyIds = empresas.map((e) => e.companyId).filter(Boolean) as string[];

    const productCounts = companyIds.length > 0
      ? await prisma.product.groupBy({ by: ["companyId"], where: { companyId: { in: companyIds } }, _count: { id: true } })
      : [];

    const empresasWithCounts = empresas.map((e) => ({
      ...e,
      _count: {
        products: productCounts.find((c) => c.companyId === e.companyId)?._count.id ?? 0,
        customers: 0,
        sales: 0,
      },
    }));

    return NextResponse.json({ empresas: empresasWithCounts });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
