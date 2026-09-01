import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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

    const data = await request.json();
    const stringFields = [
      "name", "nif", "phone", "address", "email", "logo",
      "whatsappNumber", "whatsappStore", "provinciaOperacao",
      "horarioFuncionamento", "descricaoLoja", "sobreNos",
    ];
    const updateData: any = {};

    for (const key of stringFields) {
      if (data[key] !== undefined) {
        updateData[key] = data[key] === null ? null : String(data[key]).trim();
      }
    }

    if (updateData.name !== undefined && !updateData.name) {
      return NextResponse.json({ error: "O nome da empresa não pode ficar vazio." }, { status: 400 });
    }
    if (updateData.email !== undefined && updateData.email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)) {
      return NextResponse.json({ error: "O email não é válido." }, { status: 400 });
    }
    if (data.corPrincipal !== undefined) {
      updateData.corPrincipal = String(data.corPrincipal).trim();
      if (!/^#[0-9a-fA-F]{6}$/.test(updateData.corPrincipal)) {
        return NextResponse.json({ error: "A cor principal deve ser em formato hexadecimal (ex: #2563eb)." }, { status: 400 });
      }
    }

    const result = await prisma.company.update({
      where: { id: user.companyId },
      data: updateData,
    });

    return NextResponse.json({ success: true, company: result });
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "";
    const error = /nome|email|cor/.test(message) ? message : "Erro ao actualizar empresa.";
    return NextResponse.json({ error }, { status: 400 });
  }
}
