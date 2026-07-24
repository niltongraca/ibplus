import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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
  const data = await request.json();

  const existing = await prisma.attendance.findFirst({
    where: { id, employee: { companyId: user.companyId } },
  });
  if (!existing) return NextResponse.json({ error: "Presença não encontrada." }, { status: 404 });

  const attendance = await prisma.attendance.update({
    where: { id },
    data: {
      date: data.date ? new Date(data.date) : undefined,
      checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
      checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
      status: data.status ?? undefined,
      notes: data.notes ?? undefined,
    },
  });

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
