import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const employee = await prisma.employee.findFirst({
    where: { id, companyId: user.companyId },
    include: { attendances: { orderBy: { date: "desc" }, take: 10 }, vacations: { orderBy: { startDate: "desc" } } },
  });

  if (!employee) return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });
  return NextResponse.json({ employee });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const data = await request.json();

  const result = await prisma.employee.updateMany({
    where: { id, companyId: user.companyId },
    data: {
      name: data.name ?? undefined,
      email: data.email ?? undefined,
      phone: data.phone ?? undefined,
      position: data.position ?? undefined,
      salary: data.salary !== undefined ? parseFloat(data.salary) : undefined,
      hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
      active: data.active ?? undefined,
    },
  });

  if (!result.count) return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });
  await logAction("update", "employee", id, `Funcionário atualizado`);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const result = await prisma.employee.deleteMany({ where: { id, companyId: user.companyId } });

  if (!result.count) return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });
  await logAction("delete", "employee", id, `Funcionário eliminado`);
  return NextResponse.json({ success: true });
}
