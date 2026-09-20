import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { toNumber } from "@/lib/money";
import { requireFeature, requireWrite, requireDelete } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { serviceUpdateSchema } from "@/lib/validations/catalog";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
  const denied = await requireFeature(user, "servicos"); if (denied) return denied;
  const { id } = await params;
  const service = await prisma.service.findFirst({ where: { id, companyId: user.companyId } });
  if (!service) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
  return NextResponse.json({ service: { ...service, price: toNumber(service.price) } });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
  const denied = await requireWrite(user, "servicos"); if (denied) return denied;
  const { id } = await params;

  const existing = await prisma.service.findFirst({ where: { id, companyId: user.companyId } });
  if (!existing) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });

  try {
    const parsed = await parseBody(request, serviceUpdateSchema);
    if ("error" in parsed) return parsed.error;
    const data = parsed.data;
    const update: Prisma.ServiceUncheckedUpdateInput = {};

    if (data.name !== undefined) {
      update.name = data.name;
    }
    if (data.description !== undefined) update.description = data.description || null;
    if (data.price !== undefined) {
      update.price = data.price;
    }
    if (data.duration !== undefined) update.duration = data.duration || null;
    if (data.active !== undefined) update.active = data.active === true;

    const service = await prisma.service.updateMany({ where: { id, companyId: user.companyId }, data: update });
    if (service.count === 0) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
    await logAction("update", "service", id, `Serviço atualizado`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro ao actualizar serviço:", err);
    return NextResponse.json({ error: "Erro ao actualizar serviço." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
  const denied = await requireDelete(user, "servicos"); if (denied) return denied;
  const { id } = await params;

  const result = await prisma.service.deleteMany({ where: { id, companyId: user.companyId } });
  if (result.count === 0) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
  await logAction("delete", "service", id, `Serviço eliminado`);
  return NextResponse.json({ success: true });
}
