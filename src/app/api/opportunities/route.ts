import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { toNumber } from "@/lib/money";
import { parsePagination, buildSearch } from "@/lib/utils";
import { requireFeature, requireWrite, requireDelete } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { opportunityCreateSchema, opportunityPatchSchema, opportunityDeleteSchema } from "@/lib/validations/catalog";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireFeature(user, "crm"); if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const stage = searchParams.get("stage") || undefined;
  const all = searchParams.get("all") === "true";
  const { page, limit, skip } = parsePagination(searchParams);

  if (!user.companyId) {
    return NextResponse.json({ opportunities: [], total: 0, page: 1, totalPages: 0 });
  }

  const search = buildSearch(["title", "customer.name"], searchParams.get("search"));
  const where: Prisma.OpportunityWhereInput = { companyId: user.companyId };
  if (stage) where.stage = stage;
  if (search) where.OR = search.OR;

  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      include: { customer: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      ...(all ? {} : { skip, take: limit }),
    }),
    prisma.opportunity.count({ where }),
  ]);

  return NextResponse.json({
    opportunities: opportunities.map((o) => ({ ...o, value: toNumber(o.value) })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireWrite(user, "crm"); if (denied) return denied;

  try {
    const parsed = await parseBody(request, opportunityCreateSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;
    const title = body.title;
    const customerId = body.customerId;

    const customer = await prisma.customer.findFirst({ where: { id: customerId, companyId: user.companyId } });
    if (!customer) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 400 });

    const value = body.value ?? 0;

    const stage = body.stage ?? "lead";
    const notes = body.notes || null;

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
    await logAction("create", "opportunity", opportunity.id, `Oportunidade "${title}" criada`, user);
    return NextResponse.json({ opportunity: { ...opportunity, value: toNumber(opportunity.value) } }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error && /Cliente não encontrado|título/.test(err.message) ? err.message : "Erro ao criar oportunidade.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireWrite(user, "crm"); if (denied) return denied;

  try {
    const parsed = await parseBody(request, opportunityPatchSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;
    const id = body.id;

    const data: Prisma.OpportunityUncheckedUpdateInput = {};
    if (body.stage !== undefined) {
      data.stage = body.stage;
    }
    if (body.value !== undefined) {
      data.value = body.value;
    }
    if (body.notes !== undefined) data.notes = body.notes || null;

    const result = await prisma.opportunity.updateMany({ where: { id, companyId: user.companyId }, data });
    if (!result.count) return NextResponse.json({ error: "Oportunidade não encontrada." }, { status: 404 });
    await logAction("update", "opportunity", id, `Oportunidade actualizada`, user);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao actualizar." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireDelete(user, "crm"); if (denied) return denied;

  try {
    const parsed = await parseBody(request, opportunityDeleteSchema);
    if ("error" in parsed) return parsed.error;
    const { id } = parsed.data;
    const result = await prisma.opportunity.deleteMany({ where: { id, companyId: user.companyId } });
    if (!result.count) return NextResponse.json({ error: "Oportunidade não encontrada." }, { status: 404 });
    await logAction("delete", "opportunity", id, `Oportunidade eliminada`, user);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar." }, { status: 400 });
  }
}
