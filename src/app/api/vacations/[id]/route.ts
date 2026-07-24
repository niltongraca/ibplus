import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const vacation = await prisma.vacation.findFirst({
    where: { id, employee: { companyId: user.companyId } },
    include: { employee: { select: { name: true } } },
  });

  if (!vacation) return NextResponse.json({ error: "Férias não encontradas." }, { status: 404 });
  return NextResponse.json({ vacation });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const data = await request.json();

  const existing = await prisma.vacation.findFirst({
    where: { id, employee: { companyId: user.companyId } },
  });
  if (!existing) return NextResponse.json({ error: "Férias não encontradas." }, { status: 404 });

  const vacation = await prisma.vacation.update({
    where: { id },
    data: {
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      status: data.status ?? undefined,
      notes: data.notes ?? undefined,
    },
  });

  return NextResponse.json({ vacation });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.vacation.findFirst({
    where: { id, employee: { companyId: user.companyId } },
  });
  if (!existing) return NextResponse.json({ error: "Férias não encontradas." }, { status: 404 });

  await prisma.vacation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
