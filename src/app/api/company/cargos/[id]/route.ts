import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { parseBody } from "@/lib/validations/helpers";
import { cargoUpdateSchema } from "@/lib/validations/company";

async function findCargo(id: string, companyId: string) {
  return prisma.cargo.findFirst({ where: { id, companyId } });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!user.isOwner) return NextResponse.json({ error: "Apenas o dono pode gerir os cargos." }, { status: 403 });

  const { id } = await params;
  const existing = await findCargo(id, user.companyId);
  if (!existing) return NextResponse.json({ error: "Cargo não encontrado." }, { status: 404 });

  const parsed = await parseBody(request, cargoUpdateSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;
  const data: { name?: string; description?: string | null; level?: string; active?: boolean } = {};

  if (body.name !== undefined) {
    data.name = body.name;
  }
  if (body.description !== undefined) {
    data.description = body.description || null;
  }
  if (body.level !== undefined) {
    data.level = body.level;
  }
  if (body.active !== undefined) data.active = body.active === true;

  const cargo = await prisma.cargo.update({ where: { id }, data });
  await logAction("update", "cargo", id, `Cargo "${cargo.name}" atualizado`, user);
  return NextResponse.json({ cargo });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!user.isOwner) return NextResponse.json({ error: "Apenas o dono pode gerir os cargos." }, { status: 403 });

  const { id } = await params;
  const existing = await findCargo(id, user.companyId);
  if (!existing) return NextResponse.json({ error: "Cargo não encontrado." }, { status: 404 });

  if (existing.isDefault) {
    return NextResponse.json({ error: "O cargo padrão não pode ser eliminado." }, { status: 400 });
  }

  const count = await prisma.employee.count({ where: { cargoId: id } });
  if (count > 0) {
    await prisma.cargo.update({ where: { id }, data: { active: false } });
    await logAction("delete", "cargo", id, `Cargo "${existing.name}" desativado (tem funcionários)`, user);
    return NextResponse.json({ success: true, message: "Cargo desativado porque tem funcionários atribuídos." });
  }

  await prisma.cargo.delete({ where: { id } });
  await logAction("delete", "cargo", id, `Cargo "${existing.name}" eliminado`, user);
  return NextResponse.json({ success: true });
}