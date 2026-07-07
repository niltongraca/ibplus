import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

const schema = z.object({
  email: z.string().email("Email inválido"),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const check = checkRateLimit(`forgot:${ip}`, "strict");
  if (!check.allowed) return rateLimitResponse(check.retryAfter!);
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = crypto.randomUUID();
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExpires: expires },
      });

      return NextResponse.json({
        message: "Se o email existir, receberá instruções de recuperação.",
        token,
      });
    }

    return NextResponse.json({
      message: "Se o email existir, receberá instruções de recuperação.",
    });
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
