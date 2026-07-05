import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const vacations = await prisma.vacation.findMany({
      where: { employee: { companyId: user.companyId } },
      include: { employee: { select: { name: true } } },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ vacations });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar férias." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const { employeeId, startDate, endDate, notes } = await request.json();

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId: user.companyId },
    });
    if (!employee) return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });

    const vacation = await prisma.vacation.create({
      data: {
        employeeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        notes,
      },
    });

    return NextResponse.json({ vacation }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar período de férias." }, { status: 400 });
  }
}
