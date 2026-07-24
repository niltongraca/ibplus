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

export async function PUT(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

    const { id, name, email, nif } = await request.json();
    if (!id) return NextResponse.json({ error: "ID é obrigatório." }, { status: 400 });

    const result = await prisma.company.updateMany({
      where: { id },
      data: { name: name ?? undefined, email: email ?? undefined, nif: nif ?? undefined },
    });

    if (!result.count) return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID é obrigatório." }, { status: 400 });

    const company = await prisma.company.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
    if (!company) return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
    if (company._count.users > 0) return NextResponse.json({ error: "Não é possível eliminar: existem utilizadores associados." }, { status: 400 });

    await prisma.company.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar." }, { status: 400 });
  }
}
