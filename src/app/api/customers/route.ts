import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const customers = await prisma.customer.findMany({
      where: { companyId: user.companyId },
      include: { _count: { select: { sales: true } } },
      orderBy: { name: "asc" },
    });

  return NextResponse.json({ customers });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const data = await request.json();
    const customer = await prisma.customer.create({
      data: { ...data, companyId: user.companyId },
    });
    return NextResponse.json({ customer }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar cliente." }, { status: 400 });
  }
}
