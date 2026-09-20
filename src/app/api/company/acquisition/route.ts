import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getAuthUser, signToken } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { parseBody } from "@/lib/validations/helpers";
import { companyAcquisitionSchema } from "@/lib/validations/company";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!user.isOwner) return NextResponse.json({ error: "Apenas o dono pode ver o código de aquisição." }, { status: 403 });

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { id: true, name: true, acquisitionCode: true },
  });

  return NextResponse.json({ company });
}

function generateAcquisitionCode(): string {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const parsed = await parseBody(request, companyAcquisitionSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;
    const action = body.action;

    if (action === "generate") {
      if (!user.isOwner) {
        return NextResponse.json({ error: "Apenas o dono pode gerar o código de aquisição." }, { status: 403 });
      }
      const code = generateAcquisitionCode();
      await prisma.company.update({
        where: { id: user.companyId! },
        data: { acquisitionCode: code },
      });
      await logAction("update", "company", user.companyId!, "Código de aquisição gerado");
      return NextResponse.json({ code });
    }

    // --- redeem ---
    if (user.role !== "admin" && user.companyId && !user.isOwner) {
      return NextResponse.json({ error: "Apenas o dono de uma organização pode adquirir outra empresa." }, { status: 403 });
    }
    const code = body.code || "";
    if (!code) return NextResponse.json({ error: "Indique o código de aquisição." }, { status: 400 });

    const target = await prisma.company.findUnique({ where: { acquisitionCode: code } });
    if (!target) return NextResponse.json({ error: "Código de aquisição inválido." }, { status: 404 });
    if (target.id === user.companyId) {
      return NextResponse.json({ error: "Não pode adquirir a sua própria empresa." }, { status: 400 });
    }

    const previousOwner = await prisma.employee.findFirst({
      where: { companyId: target.id, isOwner: true },
      orderBy: { createdAt: "asc" },
    });

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, phone: true, accountType: true, role: true, plan: true, tokenVersion: true },
    });
    if (!currentUser) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 401 });

    await prisma.$transaction(async (tx) => {
      // Revoga o cargo de dono do utilizador na empresa de origem (se tinha)
      if (user.companyId && user.companyId !== target.id) {
        await tx.employee.updateMany({
          where: { companyId: user.companyId, userId: user.id, isOwner: true },
          data: { isOwner: false },
        });
      }

      // O utilizador passa a pertencer à empresa adquirida
      await tx.user.update({ where: { id: user.id }, data: { companyId: target.id } });

      // O antigo dono deixa de ser dono (mantém os dados e fica como funcionário)
      if (previousOwner) {
        await tx.employee.update({ where: { id: previousOwner.id }, data: { isOwner: false } });
      }

      // Cria ou actualiza o registo do novo dono na empresa adquirida
      const existingEmployee = await tx.employee.findFirst({
        where: { companyId: target.id, userId: user.id },
      });
      if (existingEmployee) {
        await tx.employee.update({ where: { id: existingEmployee.id }, data: { isOwner: true } });
      } else {
        const ownerCargo = await tx.cargo.findFirst({
          where: { companyId: target.id, level: "owner", active: true },
          orderBy: { isDefault: "desc" },
        });
        await tx.employee.create({
          data: {
            companyId: target.id,
            userId: user.id,
            name: currentUser.name,
            email: currentUser.email,
            phone: currentUser.phone,
            position: "Dono",
            cargoId: ownerCargo?.id ?? null,
            isOwner: true,
          },
        });
      }

      // Código é de utilização única
      await tx.company.update({ where: { id: target.id }, data: { acquisitionCode: null } });
    });

    await logAction("update", "company", target.id, `Empresa adquirida por ${currentUser.name} (código usado)`);

    // Nova sessão apontando para a empresa adquirida
    const token = signToken({
      userId: currentUser.id,
      companyId: target.id,
      email: currentUser.email,
      role: currentUser.role,
      accountType: currentUser.accountType,
      plan: currentUser.plan,
      tokenVersion: currentUser.tokenVersion,
      cargoLevel: "owner",
    });

    const response = NextResponse.json({
      success: true,
      company: { id: target.id, name: target.name },
    });
    response.cookies.set("ibplus_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("código") || message.includes("aquisição") || message.includes("Código")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao processar a aquisição." }, { status: 500 });
  }
}