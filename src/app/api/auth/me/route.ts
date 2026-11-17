import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthUser, signToken, verifyToken } from "@/lib/auth";
import { getEffectiveFeatureList } from "@/lib/permissions";
import { getCompanyPlan } from "@/lib/planLimits";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const allowedFeatures = await getEffectiveFeatureList(user.companyId, user.cargoLevel);
    // O plano efetivo é o da empresa (dono); membros convidados têm `plan` FREE.
    const companyPlan = await getCompanyPlan(user);

    let response = NextResponse.json({ user: { ...user, plan: companyPlan, companyPlan, allowedFeatures } });

    const cookieStore = await cookies();
    const token = cookieStore.get("ibplus_session")?.value;
    const payload = token ? await verifyToken(token) : null;

    if (user.companyId && (payload?.cargoLevel ?? null) !== user.cargoLevel) {
      const fresh = await signToken({
        userId: user.id, companyId: user.companyId, email: user.email, role: user.role, accountType: user.accountType, plan: companyPlan, tokenVersion: user.tokenVersion, cargoLevel: user.cargoLevel,
      });
      response.cookies.set("ibplus_session", fresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}