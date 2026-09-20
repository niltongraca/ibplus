import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { requireFeature, requireTeamManage } from "@/lib/permissions";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { sendEmail, inviteEmail } from "@/lib/email";
import { parseBody } from "@/lib/validations/helpers";
import { inviteCreateSchema } from "@/lib/validations/company";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const check = checkRateLimit(`invite:${ip}`, "medium");
  if (!check.allowed) return rateLimitResponse(check.retryAfter!);

  const currentUser = await getAuthUser();
  if (!currentUser?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const denied = await requireTeamManage(currentUser);
  if (denied) return denied;

  if (currentUser.accountType === "EMPREENDEDOR") {
    return NextResponse.json({ error: "Contas de empreendedor não podem ter múltiplos utilizadores." }, { status: 403 });
  }

  try {
    const parsed = await parseBody(request, inviteCreateSchema);
    if ("error" in parsed) return parsed.error;
    const { email, role } = parsed.data;
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await prisma.invite.create({
      data: {
        companyId: currentUser.companyId,
        token,
        email: email || null,
        role: role || "user",
        accountType: currentUser.accountType as "EMPRESA" | "ONG" | "ASSOCIACAO" | "EDUCACAO" | "COOPERATIVA",
        expiresAt,
      },
    });

    if (email) {
      const mail = inviteEmail(email, token, currentUser.name);
      await sendEmail(email, mail.subject, mail.html);
    }

    return NextResponse.json({
      invite,
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://ibplus.vercel.app"}/cadastro?invite=${token}`,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao criar convite." }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const denied = await requireFeature(user, "rh");
  if (denied) return denied;

  const invites = await prisma.invite.findMany({
    where: { companyId: user.companyId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invites });
}
