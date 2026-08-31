import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

const STAGES = ["lead", "qualified", "proposal", "negotiation", "closed"];

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const stage = searchParams.get("stage") || undefined;

  if (!user.companyId) {
    return NextResponse.json({ opportunities: [] });
  }

  const where: any = { companyId: user.companyId };
  if (stage) where.stage = stage;

  const opportunities = await prisma.opportunity.findMany({
    where,
    include: { customer: { select: { name: true, email: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ opportunities });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return NextResponse.json({ error: "O título é obrigatório." }, { status: 400 });

    const customerId = typeof body.customerId === "string" && body.customerId ? body.customerId : "";
    if (!customerId) return NextResponse.json({ error: "O cliente é obrigatório." }, { status: 400 });

    const customer = await prisma.customer.findFirst({ where: { id: customerId, companyId: user.companyId } });
    if (!customer) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 400 });

    const value = body.value === undefined || body.value === null || body.value === "" ? 0 : Number(body.value);
    if (!Number.isFinite(value) || value < 0) return NextResponse.json({ error: "O valor não pode ser negativo." }, { status: 400 });

    const stage = typeof body.stage === "string" && STAGES.includes(body.stage) ? body.stage : "lead";
    const notes = body.notes ? String(body.notes).trim() : null;

    const opportunity = await prisma.opportunity.create({
      data: {
        companyId: user.companyId,
        customerId,
        title,
        value,
        stage,
        notes,
      },
      include: { customer: { select: { name: true, email: true, phone: true } } },
    });
    await logAction("create", "opportunity", opportunity.id, `Oportunidade "${title}" criada`);
    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (err: any) {
    const message = typeof err?.message === "string" && /Cliente não encontrado|título/.test(err.message) ? err.message : "Erro ao criar oportunidade.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ error: "ID em falta." }, { status: 400 });

    const data: Record<string, any> = {};
    if (body.stage !== undefined) {
      if (!STAGES.includes(String(body.stage))) return NextResponse.json({ error: "Etapa inválida." }, { status: 400 });
      data.stage = String(body.stage);
    }
    if (body.value !== undefined) {
      const value = Number(body.value);
      if (!Number.isFinite(value) || value < 0) return NextResponse.json({ error: "O valor não pode ser negativo." }, { status: 400 });
      data.value = value;
    }
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;

    const result = await prisma.opportunity.updateMany({ where: { id, companyId: user.companyId }, data });
    if (!result.count) return NextResponse.json({ error: "Oportunidade não encontrada." }, { status: 404 });
    await logAction("update", "opportunity", id, `Oportunidade actualizada`);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao actualizar." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const { id } = await request.json();
    const result = await prisma.opportunity.deleteMany({ where: { id, companyId: user.companyId } });
    if (!result.count) return NextResponse.json({ error: "Oportunidade não encontrada." }, { status: 404 });
    await logAction("delete", "opportunity", id, `Oportunidade eliminada`);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar." }, { status: 400 });
  }
}
