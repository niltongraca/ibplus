import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { toNumber } from "@/lib/money";
import { parseDateOnly } from "@/lib/utils";
import { requireFeature, requireWrite, requireDelete } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { campaignUpdateSchema } from "@/lib/validations/catalog";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireFeature(user, "marketing"); if (denied) return denied;

  const { id } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, companyId: user.companyId },
  });

  if (!campaign) return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
  return NextResponse.json({ campaign: { ...campaign, budget: campaign.budget === null ? null : toNumber(campaign.budget) } });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireWrite(user, "marketing"); if (denied) return denied;

  const { id } = await params;
  const existing = await prisma.campaign.findFirst({ where: { id, companyId: user.companyId } });
  if (!existing) return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });

  const parsed = await parseBody(request, campaignUpdateSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;
  const data: Prisma.CampaignUncheckedUpdateInput = {};

  if (body.name !== undefined) {
    data.name = body.name;
  }
  if (body.type !== undefined) {
    data.type = body.type;
  }
  if (body.status !== undefined) {
    data.status = body.status;
  }
  if (body.budget !== undefined) {
    data.budget = body.budget === null ? null : body.budget;
  }
  if (body.startDate !== undefined) {
    data.startDate = body.startDate ? (parseDateOnly(body.startDate) ?? new Date(body.startDate)) : null;
    if (data.startDate instanceof Date && isNaN(data.startDate.getTime())) return NextResponse.json({ error: "A data de início não é válida." }, { status: 400 });
  }
  if (body.endDate !== undefined) {
    data.endDate = body.endDate ? (parseDateOnly(body.endDate) ?? new Date(body.endDate)) : null;
    if (data.endDate instanceof Date && isNaN(data.endDate.getTime())) return NextResponse.json({ error: "A data de fim não é válida." }, { status: 400 });
  }
  if (body.notes !== undefined) data.notes = body.notes || null;

  const start = data.startDate instanceof Date ? data.startDate : existing.startDate;
  const end = data.endDate instanceof Date ? data.endDate : existing.endDate;
  if (start && end && end < start) return NextResponse.json({ error: "A data de fim deve ser posterior à de início." }, { status: 400 });

  await prisma.campaign.update({ where: { id }, data });
  await logAction("update", "campaign", id, `Campanha actualizada`);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireDelete(user, "marketing"); if (denied) return denied;

  const { id } = await params;
  const result = await prisma.campaign.deleteMany({ where: { id, companyId: user.companyId } });

  if (!result.count) return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
  await logAction("delete", "campaign", id, `Campanha eliminada`);
  return NextResponse.json({ success: true });
}
