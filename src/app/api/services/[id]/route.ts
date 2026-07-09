import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;
  const service = await prisma.service.findFirst({ where: { id, companyId: user.companyId! } });
  if (!service) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
  return NextResponse.json({ service });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  try {
    const data = await request.json();
    const service = await prisma.service.updateMany({
      where: { id, companyId: user.companyId! },
      data: { name: data.name, description: data.description, price: parseFloat(data.price), duration: data.duration, active: data.active },
    });
    if (service.count === 0) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao actualizar serviço." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;
  await prisma.service.deleteMany({ where: { id, companyId: user.companyId! } });
  return NextResponse.json({ success: true });
}
