import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { logAction } from "@/lib/audit";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where: { companyId: user.companyId },
      include: { _count: { select: { sales: true } } },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where: { companyId: user.companyId } }),
  ]);

  return NextResponse.json({ customers, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const data = await request.json();
    const customer = await prisma.customer.create({
      data: { ...data, companyId: user.companyId },
    });
    await logAction("create", "customer", customer.id, `Cliente "${customer.name}" criado`);
    await createNotification(user.companyId, "customer", `Novo cliente: ${customer.name}`, undefined, "/gestao/clientes");
    return NextResponse.json({ customer }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar cliente." }, { status: 400 });
  }
}
