import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

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
    const body = await request.json();
    const employeeId = typeof body.employeeId === "string" && body.employeeId ? body.employeeId : "";
    if (!employeeId) return NextResponse.json({ error: "O funcionário é obrigatório." }, { status: 400 });

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId: user.companyId },
    });
    if (!employee) return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });

    const startDate = body.startDate ? new Date(body.startDate) : null;
    if (!startDate || isNaN(startDate.getTime())) return NextResponse.json({ error: "A data de início não é válida." }, { status: 400 });

    const endDate = body.endDate ? new Date(body.endDate) : null;
    if (!endDate || isNaN(endDate.getTime())) return NextResponse.json({ error: "A data de fim não é válida." }, { status: 400 });

    if (endDate < startDate) return NextResponse.json({ error: "A data de fim deve ser posterior à de início." }, { status: 400 });

    const status = typeof body.status === "string" && ["pending", "approved", "rejected", "cancelled"].includes(body.status) ? body.status : "pending";
    const notes = body.notes ? String(body.notes).trim() : null;

    const vacation = await prisma.vacation.create({
      data: { employeeId, startDate, endDate, status, notes },
    });
    await logAction("create", "vacation", vacation.id, `Férias para "${employee.name}" solicitadas`);
    return NextResponse.json({ vacation }, { status: 201 });
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "";
    const error = /funcionário|data|deve ser posterior/.test(message) ? message : "Erro ao criar período de férias.";
    return NextResponse.json({ error }, { status: 400 });
  }
}
