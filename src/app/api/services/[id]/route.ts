import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
  const { id } = await params;
  const service = await prisma.service.findFirst({ where: { id, companyId: user.companyId } });
  if (!service) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
  return NextResponse.json({ service });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
  const { id } = await params;

  const existing = await prisma.service.findFirst({ where: { id, companyId: user.companyId } });
  if (!existing) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });

  try {
    const data = await request.json();
    const update: Record<string, any> = {};

    if (data.name !== undefined) {
      const name = String(data.name).trim();
      if (!name) return NextResponse.json({ error: "O nome não pode ficar vazio." }, { status: 400 });
      update.name = name;
    }
    if (data.description !== undefined) update.description = data.description ? String(data.description).trim() : null;
    if (data.price !== undefined) {
      const priceNum = Number(data.price);
      if (!Number.isFinite(priceNum) || priceNum <= 0) return NextResponse.json({ error: "O preço deve ser um número positivo." }, { status: 400 });
      update.price = priceNum;
    }
    if (data.duration !== undefined) update.duration = data.duration ? String(data.duration).trim() : null;
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
  const { id } = await params;

  const result = await prisma.service.deleteMany({ where: { id, companyId: user.companyId } });
  if (result.count === 0) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
  await logAction("delete", "service", id, `Serviço eliminado`);
  return NextResponse.json({ success: true });
}
