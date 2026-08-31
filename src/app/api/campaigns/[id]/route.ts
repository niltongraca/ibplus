import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

const TYPES = ["email", "social", "sms", "whatsapp", "other"];
const STATUSES = ["draft", "active", "paused", "completed", "cancelled"];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, companyId: user.companyId },
  });

  if (!campaign) return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
  return NextResponse.json({ campaign });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.campaign.findFirst({ where: { id, companyId: user.companyId } });
  if (!existing) return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });

  const body = await request.json();
  const data: Record<string, any> = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "O nome não pode ficar vazio." }, { status: 400 });
    data.name = name;
  }
  if (body.type !== undefined) {
    if (!TYPES.includes(String(body.type))) return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
    data.type = String(body.type);
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(String(body.status))) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    data.status = String(body.status);
  }
  if (body.budget !== undefined) {
    if (body.budget === null || body.budget === "") {
      data.budget = null;
    } else {
      const budget = Number(body.budget);
      if (!Number.isFinite(budget) || budget < 0) return NextResponse.json({ error: "O orçamento não pode ser negativo." }, { status: 400 });
      data.budget = budget;
    }
  }
  if (body.startDate !== undefined) {
    data.startDate = body.startDate ? new Date(body.startDate) : null;
    if (data.startDate && isNaN(data.startDate.getTime())) return NextResponse.json({ error: "A data de início não é válida." }, { status: 400 });
  }
  if (body.endDate !== undefined) {
    data.endDate = body.endDate ? new Date(body.endDate) : null;
    if (data.endDate && isNaN(data.endDate.getTime())) return NextResponse.json({ error: "A data de fim não é válida." }, { status: 400 });
  }
  if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;

  const start = data.startDate !== undefined ? data.startDate : existing.startDate;
  const end = data.endDate !== undefined ? data.endDate : existing.endDate;
  if (start && end && end < start) return NextResponse.json({ error: "A data de fim deve ser posterior à de início." }, { status: 400 });

  await prisma.campaign.update({ where: { id }, data });
  await logAction("update", "campaign", id, `Campanha actualizada`);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const result = await prisma.campaign.deleteMany({ where: { id, companyId: user.companyId } });

  if (!result.count) return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
  await logAction("delete", "campaign", id, `Campanha eliminada`);
  return NextResponse.json({ success: true });
}
