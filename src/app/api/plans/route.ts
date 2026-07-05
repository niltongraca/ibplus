import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { PLAN_LIST } from "@/config/plans";
import type { PlanId } from "@/config/plans";

export async function GET() {
  return NextResponse.json({ plans: PLAN_LIST });
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("ibplus_session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
    }

    const { plan } = await request.json();
    const validPlans: PlanId[] = ["FREE", "PREMIUM", "BUSINESS"];

    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { plan },
      select: { id: true, name: true, email: true, accountType: true, plan: true, role: true, companyId: true },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
