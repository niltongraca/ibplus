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
  const existing = await prisma.employee.findFirst({ where: { id, companyId: user.companyId } });
  if (!existing) return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });

  const body = await request.json();
  const data: Record<string, any> = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "O nome não pode ficar vazio." }, { status: 400 });
    data.name = name;
  }
  if (body.email !== undefined) {
    const email = body.email ? String(body.email).trim() : "";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "O email não é válido." }, { status: 400 });
    data.email = email || null;
  }
  if (body.phone !== undefined) data.phone = body.phone ? String(body.phone).trim() : null;
  if (body.position !== undefined) data.position = body.position ? String(body.position).trim() : null;
  if (body.salary !== undefined) {
    const salary = Number(body.salary);
    if (!Number.isFinite(salary) || salary < 0) return NextResponse.json({ error: "O salário não pode ser negativo." }, { status: 400 });
    data.salary = salary;
  }
  if (body.hireDate !== undefined) {
    if (body.hireDate) {
      const hireDate = new Date(body.hireDate);
      if (isNaN(hireDate.getTime())) return NextResponse.json({ error: "A data de admissão não é válida." }, { status: 400 });
      data.hireDate = hireDate;
    } else {
      data.hireDate = null;
    }
  }
  if (body.active !== undefined) data.active = body.active === true;

  const result = await prisma.employee.updateMany({ where: { id, companyId: user.companyId }, data });
  if (!result.count) return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });
  await logAction("update", "employee", id, `Funcionário atualizado`);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const employee = await prisma.employee.findFirst({
    where: { id, companyId: user.companyId },
    include: { _count: { select: { attendances: true, vacations: true } } },
  });
  if (!employee) return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });

  if (employee._count.attendances > 0 || employee._count.vacations > 0) {
    await prisma.employee.update({ where: { id }, data: { active: false } });
    await logAction("delete", "employee", id, `Funcionário "${employee.name}" desativado (tem histórico)`);
    return NextResponse.json({ success: true, message: "Funcionário desativado porque tem histórico." });
  }

  const result = await prisma.employee.deleteMany({ where: { id, companyId: user.companyId } });
  if (!result.count) return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });
  await logAction("delete", "employee", id, `Funcionário eliminado`);
  return NextResponse.json({ success: true });
}
