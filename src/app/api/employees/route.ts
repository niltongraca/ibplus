import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const employees = await prisma.employee.findMany({
    where: { companyId: user.companyId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ employees });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const data = await request.json();
    const employee = await prisma.employee.create({
      data: { ...data, companyId: user.companyId },
    });
    return NextResponse.json({ employee }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar funcionário." }, { status: 400 });
  }
}
