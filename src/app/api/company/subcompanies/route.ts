import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

const SUB_TYPES = ["SUBEMPRESA", "ORGANIZACAO", "FILIAL", "SUCURSAL"] as const;

export async function GET() {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const subCompanies = await prisma.subCompany.findMany({
    where: { companyId: user.companyId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ subCompanies });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!user.isOwner) return NextResponse.json({ error: "Apenas o dono pode gerir as subempresas e organizações." }, { status: 403 });

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "O nome é obrigatório." }, { status: 400 });

    const type = SUB_TYPES.includes(body.type) ? body.type : "SUBEMPRESA";

    const subCompany = await prisma.subCompany.create({
      data: {
        companyId: user.companyId,
        name,
        type,
        sector: body.sector ? String(body.sector).trim() : null,
        address: body.address ? String(body.address).trim() : null,
        description: body.description ? String(body.description).trim() : null,
        active: body.active === false ? false : true,
      },
    });
    await logAction("create", "subcompany", subCompany.id, `Subempresa "${subCompany.name}" registada`);
    return NextResponse.json({ subCompany }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao registar subempresa." }, { status: 400 });
  }
}