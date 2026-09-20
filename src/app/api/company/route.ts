import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import { parseBody } from "@/lib/validations/helpers";
import { companyUpdateSchema } from "@/lib/validations/company";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const company = await prisma.company.findUnique({ where: { id: user.companyId } });
    return NextResponse.json({ company });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar empresa." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const parsed = await parseBody(request, companyUpdateSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;
    const updateData: Prisma.CompanyUncheckedUpdateInput = {};

    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    const nullableFields = [
      "nif", "phone", "address", "email", "logo",
      "whatsappNumber", "whatsappStore", "provinciaOperacao",
      "horarioFuncionamento", "descricaoLoja", "sobreNos",
    ] as const;

    for (const key of nullableFields) {
      if (body[key] !== undefined) updateData[key] = body[key] === null ? null : body[key];
    }

    if (body.corPrincipal !== undefined) {
      updateData.corPrincipal = body.corPrincipal;
    }

    const result = await prisma.company.update({
      where: { id: user.companyId },
      data: updateData,
    });

    return NextResponse.json({ success: true, company: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const error = /nome|email|cor/.test(message) ? message : "Erro ao actualizar empresa.";
    return NextResponse.json({ error }, { status: 400 });
  }
}
