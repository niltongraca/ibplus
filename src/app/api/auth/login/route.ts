import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { ensureCompanyOwner } from "@/lib/ownership";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { parseBody } from "@/lib/validations/helpers";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const check = await checkRateLimit(`login:${ip}`, "strict");
  if (!check.allowed) return rateLimitResponse(check.retryAfter!);

  try {
    const parsed = await parseBody(request, loginSchema);
    if ("error" in parsed) return parsed.error;
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Email ou senha inválidos." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Email ou senha inválidos." }, { status: 401 });
    }

    const ownerInfo = await ensureCompanyOwner(user);
    const cargoLevel = ownerInfo.cargoLevel;

    const token = await signToken({ userId: user.id, companyId: user.companyId, email: user.email, role: user.role, accountType: user.accountType, plan: user.plan, tokenVersion: user.tokenVersion, cargoLevel });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar, coverPhoto: user.coverPhoto, accountType: user.accountType, plan: user.plan, companyId: user.companyId, role: user.role, isOwner: ownerInfo.isOwner, cargoLevel },
    });

    response.cookies.set("ibplus_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
