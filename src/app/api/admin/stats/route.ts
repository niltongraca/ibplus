import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const [totalUsers, totalCompanies, counts] = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
    prisma.user.groupBy({ by: ["role"], _count: true }),
  ]);

  const stats = {
    totalUsers,
    totalCompanies,
    empresaCount: counts.find((c) => c.role === "empresa")?._count ?? 0,
    particularCount: counts.find((c) => c.role === "particular")?._count ?? 0,
  };

  return NextResponse.json(stats);
}
