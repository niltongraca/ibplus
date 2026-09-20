import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import { parseDateOnly } from "@/lib/utils";
import { requireFeature, requireTeamManage } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { vacationUpdateSchema } from "@/lib/validations/rh";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireFeature(user, "rh"); if (denied) return denied;

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
  const denied = await requireTeamManage(user); if (denied) return denied;

  const { id } = await params;
  const existing = await prisma.vacation.findFirst({
    where: { id, employee: { companyId: user.companyId } },
  });
  if (!existing) return NextResponse.json({ error: "Férias não encontradas." }, { status: 404 });

  const parsed = await parseBody(request, vacationUpdateSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;
  const data: Prisma.VacationUncheckedUpdateInput = {};

  if (body.startDate !== undefined && body.startDate) {
    const startDate = parseDateOnly(body.startDate) ?? new Date(body.startDate);
    if (isNaN(startDate.getTime())) return NextResponse.json({ error: "A data de início não é válida." }, { status: 400 });
    data.startDate = startDate;
  }
  if (body.endDate !== undefined && body.endDate) {
    const endDate = parseDateOnly(body.endDate) ?? new Date(body.endDate);
    if (isNaN(endDate.getTime())) return NextResponse.json({ error: "A data de fim não é válida." }, { status: 400 });
    data.endDate = endDate;
  }
  if (body.status !== undefined) {
    data.status = body.status;
  }
  if (body.notes !== undefined) data.notes = body.notes || null;

  const start = data.startDate instanceof Date ? data.startDate : existing.startDate;
  const end = data.endDate instanceof Date ? data.endDate : existing.endDate;
  if (end < start) return NextResponse.json({ error: "A data de fim deve ser posterior à de início." }, { status: 400 });

  const vacation = await prisma.vacation.update({ where: { id }, data });
  return NextResponse.json({ vacation });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireTeamManage(user); if (denied) return denied;

  const { id } = await params;
  const existing = await prisma.vacation.findFirst({
    where: { id, employee: { companyId: user.companyId } },
  });
  if (!existing) return NextResponse.json({ error: "Férias não encontradas." }, { status: 404 });

  await prisma.vacation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
