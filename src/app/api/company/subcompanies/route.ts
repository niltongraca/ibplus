import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { parseBody } from "@/lib/validations/helpers";
import { subCompanyCreateSchema } from "@/lib/validations/company";

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
    const parsed = await parseBody(request, subCompanyCreateSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;

    const name = body.name;
    const type = body.type ?? "SUBEMPRESA";

    const subCompany = await prisma.subCompany.create({
      data: {
        companyId: user.companyId,
        name,
        type,
        sector: body.sector || null,
        address: body.address || null,
        description: body.description || null,
        active: body.active === false ? false : true,
      },
    });
    await logAction("create", "subcompany", subCompany.id, `Subempresa "${subCompany.name}" registada`);
    return NextResponse.json({ subCompany }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Já existe uma subempresa com esse nome." }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao registar subempresa." }, { status: 400 });
  }
}