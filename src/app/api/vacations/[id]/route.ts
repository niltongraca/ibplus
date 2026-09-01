import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

const STATUSES = ["pending", "approved", "rejected", "cancelled"];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const vacation = await prisma.vacation.findFirst({
    where: { id, employee: { companyId: user.companyId } },
    include: { employee: { select: { name: true } } },
  });

  if (!vacation) return NextResponse.json({ error: "Férias não encontradas." }, { status: 404 });
  return NextResponse.json({ vacation });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.vacation.findFirst({
    where: { id, employee: { companyId: user.companyId } },
  });
  if (!existing) return NextResponse.json({ error: "Férias não encontradas." }, { status: 404 });

  const body = await request.json();
  const data: Record<string, any> = {};

  if (body.startDate !== undefined) {
    const startDate = new Date(body.startDate);
    if (isNaN(startDate.getTime())) return NextResponse.json({ error: "A data de início não é válida." }, { status: 400 });
    data.startDate = startDate;
  }
  if (body.endDate !== undefined) {
    const endDate = new Date(body.endDate);
    if (isNaN(endDate.getTime())) return NextResponse.json({ error: "A data de fim não é válida." }, { status: 400 });
    data.endDate = endDate;
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(String(body.status))) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    data.status = String(body.status);
  }
  if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;

  const start = data.startDate !== undefined ? data.startDate : existing.startDate;
  const end = data.endDate !== undefined ? data.endDate : existing.endDate;
  if (end < start) return NextResponse.json({ error: "A data de fim deve ser posterior à de início." }, { status: 400 });

  const vacation = await prisma.vacation.update({ where: { id }, data });
  return NextResponse.json({ vacation });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.vacation.findFirst({
    where: { id, employee: { companyId: user.companyId } },
  });
  if (!existing) return NextResponse.json({ error: "Férias não encontradas." }, { status: 404 });

  await prisma.vacation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
