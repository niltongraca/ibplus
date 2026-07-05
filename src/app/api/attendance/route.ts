import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const attendances = await prisma.attendance.findMany({
      where: { employee: { companyId: user.companyId } },
      include: { employee: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 100,
    });

    return NextResponse.json({ attendances });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar presenças." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const { employeeId, date, checkIn, checkOut, status, notes } = await request.json();

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId: user.companyId },
    });
    if (!employee) return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        date: new Date(date),
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        status: status || "present",
        notes,
      },
    });

    return NextResponse.json({ attendance }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao registar presença." }, { status: 400 });
  }
}
