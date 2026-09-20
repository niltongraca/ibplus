import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { toNumber } from "@/lib/money";
import { parseDateOnly } from "@/lib/utils";
import { requireFeature, requireTeamManage } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { employeeUpdateSchema } from "@/lib/validations/rh";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireFeature(user, "rh"); if (denied) return denied;

  const { id } = await params;
  const employee = await prisma.employee.findFirst({
    where: { id, companyId: user.companyId },
    include: { cargo: { select: { id: true, name: true, level: true } }, attendances: { orderBy: { date: "desc" }, take: 10 }, vacations: { orderBy: { startDate: "desc" } } },
  });

  if (!employee) return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });
  return NextResponse.json({ employee: { ...employee, salary: toNumber(employee.salary) } });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireTeamManage(user); if (denied) return denied;

  const { id } = await params;
  const existing = await prisma.employee.findFirst({ where: { id, companyId: user.companyId } });
  if (!existing) return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });

  const parsed = await parseBody(request, employeeUpdateSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;
  const data: Prisma.EmployeeUncheckedUpdateInput = {};

  if (body.name !== undefined) {
    data.name = body.name;
  }
  if (body.email !== undefined) {
    data.email = body.email || null;
  }
  if (body.phone !== undefined) data.phone = body.phone || null;
  if (body.position !== undefined) data.position = body.position || null;
  if (body.salary !== undefined) {
    data.salary = body.salary ?? 0;
  }
  if (body.hireDate !== undefined) {
    if (body.hireDate) {
      const hireDate = parseDateOnly(body.hireDate) ?? new Date(body.hireDate);
      if (isNaN(hireDate.getTime())) return NextResponse.json({ error: "A data de admissão não é válida." }, { status: 400 });
      data.hireDate = hireDate;
    } else {
      data.hireDate = null;
    }
  }
  if (body.active !== undefined) data.active = body.active === true;
  if (body.cargoId !== undefined) {
    if (body.cargoId) {
      const cargo = await prisma.cargo.findFirst({
        where: { id: String(body.cargoId), companyId: user.companyId, active: true },
      });
      if (!cargo) return NextResponse.json({ error: "Cargo inválido." }, { status: 400 });
      if (existing.isOwner && cargo.level !== "owner") {
        return NextResponse.json({ error: "O dono da organização só pode ter cargos de nível Dono." }, { status: 400 });
      }
      data.cargoId = cargo.id;
    } else {
      if (existing.isOwner) {
        return NextResponse.json({ error: "O dono da organização deve ter um cargo de nível Dono." }, { status: 400 });
      }
      data.cargoId = null;
    }
  }

  const result = await prisma.employee.updateMany({ where: { id, companyId: user.companyId }, data });
  if (!result.count) return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });
  await logAction("update", "employee", id, `Funcionário atualizado`);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireTeamManage(user); if (denied) return denied;

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
