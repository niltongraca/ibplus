import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const expenses = await prisma.expense.findMany({
    where: { companyId: user.companyId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ expenses });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const data = await request.json();
    const expense = await prisma.expense.create({
      data: { ...data, companyId: user.companyId },
    });
    return NextResponse.json({ expense }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar despesa." }, { status: 400 });
  }
}
