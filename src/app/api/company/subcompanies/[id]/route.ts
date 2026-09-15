import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

const SUB_TYPES = ["SUBEMPRESA", "ORGANIZACAO", "FILIAL", "SUCURSAL"] as const;

async function findSubCompany(id: string, companyId: string) {
  return prisma.subCompany.findFirst({ where: { id, companyId } });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!user.isOwner) return NextResponse.json({ error: "Apenas o dono pode gerir as subempresas e organizações." }, { status: 403 });

  const { id } = await params;
  const existing = await findSubCompany(id, user.companyId);
  if (!existing) return NextResponse.json({ error: "Subempresa não encontrada." }, { status: 404 });

  const body = await request.json();
  const data: { name?: string; type?: string; sector?: string | null; address?: string | null; description?: string | null; active?: boolean } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "O nome não pode ficar vazio." }, { status: 400 });
    data.name = name;
  }
  if (body.type !== undefined) {
    if (!SUB_TYPES.includes(body.type)) {
      return NextResponse.json({ error: "Tipo de subempresa inválido." }, { status: 400 });
    }
    data.type = body.type;
  }
  if (body.sector !== undefined) data.sector = body.sector ? String(body.sector).trim() : null;
  if (body.address !== undefined) data.address = body.address ? String(body.address).trim() : null;
  if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
  if (body.active !== undefined) data.active = body.active === true;

  const subCompany = await prisma.subCompany.update({ where: { id }, data });
  await logAction("update", "subcompany", id, `Subempresa "${subCompany.name}" atualizada`);
  return NextResponse.json({ subCompany });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!user.isOwner) return NextResponse.json({ error: "Apenas o dono pode gerir as subempresas e organizações." }, { status: 403 });

  const { id } = await params;
  const existing = await findSubCompany(id, user.companyId);
  if (!existing) return NextResponse.json({ error: "Subempresa não encontrada." }, { status: 404 });

  await prisma.subCompany.delete({ where: { id } });
  await logAction("delete", "subcompany", id, `Subempresa "${existing.name}" eliminada`);
  return NextResponse.json({ success: true });
}