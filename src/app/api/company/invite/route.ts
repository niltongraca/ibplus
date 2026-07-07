import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { sendEmail, inviteEmail } from "@/lib/email";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const check = checkRateLimit(`invite:${ip}`, "medium");
  if (!check.allowed) return rateLimitResponse(check.retryAfter!);

  const currentUser = await getAuthUser();
  if (!currentUser?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  if (currentUser.accountType === "EMPREENDEDOR") {
    return NextResponse.json({ error: "Contas de empreendedor não podem ter múltiplos utilizadores." }, { status: 403 });
  }

  try {
    const { email, role } = await request.json();
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await prisma.invite.create({
      data: {
        companyId: currentUser.companyId,
        token,
        email: email || null,
        role: role || "user",
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

  const invites = await prisma.invite.findMany({
    where: { companyId: user.companyId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invites });
}
