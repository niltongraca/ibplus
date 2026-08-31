import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

const TYPES = ["email", "social", "sms", "whatsapp", "other"];
const STATUSES = ["draft", "active", "paused", "completed", "cancelled"];

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const campaigns = await prisma.campaign.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ campaigns });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar campanhas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

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
      startDate = new Date(body.startDate);
      if (isNaN(startDate.getTime())) return NextResponse.json({ error: "A data de início não é válida." }, { status: 400 });
    }
    if (body.endDate) {
      endDate = new Date(body.endDate);
      if (isNaN(endDate.getTime())) return NextResponse.json({ error: "A data de fim não é válida." }, { status: 400 });
    }
    if (startDate && endDate && endDate < startDate) return NextResponse.json({ error: "A data de fim deve ser posterior à de início." }, { status: 400 });

    const campaign = await prisma.campaign.create({
      data: { companyId: user.companyId, name, type, status, startDate, endDate, budget, notes },
    });
    await logAction("create", "campaign", campaign.id, `Campanha "${name}" criada`);
    return NextResponse.json({ campaign }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar campanha." }, { status: 400 });
  }
}
