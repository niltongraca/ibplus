import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parsePagination, buildSearch } from "@/lib/utils";
import type { Prisma, AccountType, PlanType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

    const url = new URL(request.url);
    const { page, limit, skip } = parsePagination(url.searchParams);
    const search = buildSearch(["name", "email", "phone"], url.searchParams.get("search"));
    const accountType = url.searchParams.get("accountType") || undefined;
    const plan = url.searchParams.get("plan") || undefined;
    const role = url.searchParams.get("role") || undefined;
    const where: Prisma.UserWhereInput = {
      ...(search ?? {}),
      ...(accountType ? { accountType: accountType as AccountType } : {}),
      ...(plan ? { plan: plan as PlanType } : {}),
      ...(role ? { role } : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          accountType: true,
          plan: true,
          role: true,
          createdAt: true,
          profile: { select: { nome: true, nif: true } },
          companyProfile: { select: { nomeEmpresa: true, nif: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

    const { id, role, plan, accountType } = await request.json();
    if (!id) return NextResponse.json({ error: "ID é obrigatório." }, { status: 400 });

    const result = await prisma.user.updateMany({
      where: { id },
      data: {
        role: role ?? undefined,
        plan: plan ?? undefined,
        accountType: accountType ?? undefined,
      },
    });

    if (!result.count) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
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
    if (id === user.id) return NextResponse.json({ error: "Não pode eliminar a sua própria conta." }, { status: 400 });

    const result = await prisma.user.deleteMany({ where: { id } });
    if (!result.count) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar." }, { status: 400 });
  }
}
