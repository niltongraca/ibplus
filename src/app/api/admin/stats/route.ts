import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    const [totalUsers, totalCompanies, typeCounts, planCounts] = await Promise.all([
      prisma.user.count(),
      prisma.company.count(),
      prisma.user.groupBy({ by: ["accountType"], _count: true }),
      prisma.user.groupBy({ by: ["plan"], _count: true }),
    ]);

    const stats = {
      totalUsers,
      totalCompanies,
      empresaCount: typeCounts.find((c) => c.accountType === "EMPRESA")?._count ?? 0,
      empreendedorCount: typeCounts.find((c) => c.accountType === "EMPREENDEDOR")?._count ?? 0,
      ongCount: typeCounts.find((c) => c.accountType === "ONG")?._count ?? 0,
      educacaoCount: typeCounts.find((c) => c.accountType === "EDUCACAO")?._count ?? 0,
      associacaoCount: typeCounts.find((c) => c.accountType === "ASSOCIACAO")?._count ?? 0,
      cooperativaCount: typeCounts.find((c) => c.accountType === "COOPERATIVA")?._count ?? 0,
      freeCount: planCounts.find((c) => c.plan === "FREE")?._count ?? 0,
      premiumCount: planCounts.find((c) => c.plan === "PREMIUM")?._count ?? 0,
      businessCount: planCounts.find((c) => c.plan === "BUSINESS")?._count ?? 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
