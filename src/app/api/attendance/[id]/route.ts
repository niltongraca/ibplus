import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

const STATUSES = ["present", "absent", "late", "half_day", "justified"];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const attendance = await prisma.attendance.findFirst({
    where: { id, employee: { companyId: user.companyId } },
    include: { employee: { select: { name: true, position: true } } },
  });

  if (!attendance) return NextResponse.json({ error: "Presença não encontrada." }, { status: 404 });
  return NextResponse.json({ attendance });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.attendance.findFirst({
    where: { id, employee: { companyId: user.companyId } },
  });
  if (!existing) return NextResponse.json({ error: "Presença não encontrada." }, { status: 404 });

  const body = await request.json();
  const data: Record<string, any> = {};

  if (body.date !== undefined) {
    const date = new Date(body.date);
    if (isNaN(date.getTime())) return NextResponse.json({ error: "A data não é válida." }, { status: 400 });
    data.date = date;
  }
  if (body.checkIn !== undefined) {
    if (body.checkIn) {
      const checkIn = new Date(body.checkIn);
      if (isNaN(checkIn.getTime())) return NextResponse.json({ error: "A hora de entrada não é válida." }, { status: 400 });
      data.checkIn = checkIn;
    } else {
      data.checkIn = null;
    }
  }
  if (body.checkOut !== undefined) {
    if (body.checkOut) {
      const checkOut = new Date(body.checkOut);
      if (isNaN(checkOut.getTime())) return NextResponse.json({ error: "A hora de saída não é válida." }, { status: 400 });
      data.checkOut = checkOut;
    } else {
      data.checkOut = null;
    }
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(String(body.status))) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    data.status = String(body.status);
  }
  if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;

  const checkIn = data.checkIn !== undefined ? data.checkIn : existing.checkIn;
  const checkOut = data.checkOut !== undefined ? data.checkOut : existing.checkOut;
  if (checkIn && checkOut && checkOut < checkIn) return NextResponse.json({ error: "A saída deve ser após a entrada." }, { status: 400 });

  const attendance = await prisma.attendance.update({ where: { id }, data });
  return NextResponse.json({ attendance });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.attendance.findFirst({
    where: { id, employee: { companyId: user.companyId } },
  });
  if (!existing) return NextResponse.json({ error: "Presença não encontrada." }, { status: 404 });

  await prisma.attendance.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
