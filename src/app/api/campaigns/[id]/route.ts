import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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
  const data = await request.json();

  const result = await prisma.campaign.updateMany({
    where: { id, companyId: user.companyId },
    data: {
      name: data.name ?? undefined,
      type: data.type ?? undefined,
      status: data.status ?? undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      budget: data.budget !== undefined ? parseFloat(data.budget) : undefined,
      notes: data.notes ?? undefined,
    },
  });

  if (!result.count) return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const result = await prisma.campaign.deleteMany({ where: { id, companyId: user.companyId } });

  if (!result.count) return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
  return NextResponse.json({ success: true });
}
