import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { parseBody } from "@/lib/validations/helpers";
import { cargoCreateSchema } from "@/lib/validations/company";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const url = new URL(request.url);
  const all = url.searchParams.get("all") === "true";

  const cargos = await prisma.cargo.findMany({
    where: { companyId: user.companyId, ...(all ? {} : { active: true }) },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    include: { _count: { select: { employees: true } } },
  });

  return NextResponse.json({ cargos });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!user.isOwner) return NextResponse.json({ error: "Apenas o dono pode gerir os cargos." }, { status: 403 });

  try {
    const parsed = await parseBody(request, cargoCreateSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;
    const name = body.name;

    const level = body.level ?? "collaborator";

    const cargo = await prisma.cargo.create({
      data: {
        companyId: user.companyId,
        name,
        description: body.description || null,
        level,
        active: body.active === false ? false : true,
      },
    });
    await logAction("create", "cargo", cargo.id, `Cargo "${cargo.name}" criado`);
    return NextResponse.json({ cargo }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar cargo." }, { status: 400 });
  }
}