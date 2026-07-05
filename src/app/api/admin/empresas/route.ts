import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

    const empresas = await prisma.user.findMany({
      where: { tipo: "empresa" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyId: true,
        company: { select: { id: true, name: true, nif: true, email: true } },
        empresa: { select: { nomeCompleto: true, NIF: true, BI: true, registoComercial: true } },
        _count: { select: { products: true, customers: true, sales: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ empresas });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
