import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

const STATUSES = ["present", "absent", "late", "half_day", "justified"];

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
    const body = await request.json();
    const employeeId = typeof body.employeeId === "string" && body.employeeId ? body.employeeId : "";
    if (!employeeId) return NextResponse.json({ error: "O funcionário é obrigatório." }, { status: 400 });

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId: user.companyId },
    });
    if (!employee) return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });

    const date = body.date ? new Date(body.date) : new Date();
    if (isNaN(date.getTime())) return NextResponse.json({ error: "A data não é válida." }, { status: 400 });

    let checkIn: Date | null = null;
    let checkOut: Date | null = null;
    if (body.checkIn) {
      checkIn = new Date(body.checkIn);
      if (isNaN(checkIn.getTime())) return NextResponse.json({ error: "A hora de entrada não é válida." }, { status: 400 });
    }
    if (body.checkOut) {
      checkOut = new Date(body.checkOut);
      if (isNaN(checkOut.getTime())) return NextResponse.json({ error: "A hora de saída não é válida." }, { status: 400 });
    }
    if (checkIn && checkOut && checkOut < checkIn) return NextResponse.json({ error: "A saída deve ser após a entrada." }, { status: 400 });

    const status = typeof body.status === "string" && STATUSES.includes(body.status) ? body.status : "present";
    const notes = body.notes ? String(body.notes).trim() : null;

    const attendance = await prisma.attendance.create({
      data: { employeeId, date, checkIn, checkOut, status, notes },
    });
    await logAction("create", "attendance", attendance.id, `Presença registada para "${employee.name}"`);
    return NextResponse.json({ attendance }, { status: 201 });
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "";
    const error = /funcionário|data|entrada|saída/.test(message) ? message : "Erro ao registar presença.";
    return NextResponse.json({ error }, { status: 400 });
  }
}
