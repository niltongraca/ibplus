import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) return NextResponse.json({ error: "Falta o token do convite." }, { status: 400 });

  try {
    const invite = await prisma.invite.findUnique({
      where: { token },
      select: {
        id: true,
        companyId: true,
        accountType: true,
        used: true,
        expiresAt: true,
        email: true,
        company: { select: { name: true, logo: true } },
      },
    });

    if (!invite) return NextResponse.json({ error: "Link de convite inválido." }, { status: 404 });
    if (invite.used) return NextResponse.json({ error: "Este convite já foi utilizado." }, { status: 400 });
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Este convite expirou." }, { status: 400 });

    const cargos = await prisma.cargo.findMany({
      where: { companyId: invite.companyId, active: true },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      select: { id: true, name: true, description: true, level: true, isDefault: true },
    });

    return NextResponse.json({
      company: { name: invite.company.name, logo: invite.company.logo },
      accountType: invite.accountType,
      cargos,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar convite." }, { status: 500 });
  }
}