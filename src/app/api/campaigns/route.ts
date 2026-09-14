import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { toNumber } from "@/lib/money";
import { parseDateOnly, parsePagination, buildSearch } from "@/lib/utils";
import { requireFeature, requireWrite } from "@/lib/permissions";

const TYPES = ["email", "social", "sms", "whatsapp", "other"];
const STATUSES = ["draft", "active", "paused", "completed", "cancelled"];

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const denied = await requireFeature(user, "marketing"); if (denied) return denied;

    const url = new URL(request.url);
    const { page, limit, skip } = parsePagination(url.searchParams);
    const search = buildSearch(["name"], url.searchParams.get("search"));
    const type = url.searchParams.get("type") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const where = {
      companyId: user.companyId,
      ...(search ?? {}),
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    };

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    return NextResponse.json({
      campaigns: campaigns.map((c) => ({ ...c, budget: c.budget === null ? null : toNumber(c.budget) })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar campanhas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireWrite(user, "marketing"); if (denied) return denied;

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "O nome é obrigatório." }, { status: 400 });

    const type = typeof body.type === "string" && TYPES.includes(body.type) ? body.type : "email";
    const status = typeof body.status === "string" && STATUSES.includes(body.status) ? body.status : "draft";
    const notes = body.notes ? String(body.notes).trim() : null;

    let budget: number | null = null;
    if (body.budget !== undefined && body.budget !== null && body.budget !== "") {
      budget = Number(body.budget);
      if (!Number.isFinite(budget) || budget < 0) return NextResponse.json({ error: "O orçamento não pode ser negativo." }, { status: 400 });
    }

    let startDate: Date | null = null;
    let endDate: Date | null = null;
    if (body.startDate) {
      startDate = parseDateOnly(body.startDate) ?? new Date(body.startDate);
      if (isNaN(startDate.getTime())) return NextResponse.json({ error: "A data de início não é válida." }, { status: 400 });
    }
    if (body.endDate) {
      endDate = parseDateOnly(body.endDate) ?? new Date(body.endDate);
      if (isNaN(endDate.getTime())) return NextResponse.json({ error: "A data de fim não é válida." }, { status: 400 });
    }
    if (startDate && endDate && endDate < startDate) return NextResponse.json({ error: "A data de fim deve ser posterior à de início." }, { status: 400 });

    const campaign = await prisma.campaign.create({
      data: { companyId: user.companyId, name, type, status, startDate, endDate, budget, notes },
    });
    await logAction("create", "campaign", campaign.id, `Campanha "${name}" criada`);
    return NextResponse.json({ campaign: { ...campaign, budget: campaign.budget === null ? null : toNumber(campaign.budget) } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar campanha." }, { status: 400 });
  }
}
