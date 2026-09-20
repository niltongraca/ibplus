import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { parseBody } from "@/lib/validations/helpers";
import { changePasswordSchema } from "@/lib/validations/auth";

export async function PUT(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const ip = getClientIp(request);
  const check = await checkRateLimit(`password:${user.id}:${ip}`, "medium");
  if (!check.allowed) return rateLimitResponse(check.retryAfter!);

  const parsed = await parseBody(request, changePasswordSchema);
  if ("error" in parsed) return parsed.error;
  const { currentPassword, newPassword } = parsed.data;

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, dbUser.password);
  if (!valid) return NextResponse.json({ error: "Senha actual incorrecta." }, { status: 401 });

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed, tokenVersion: { increment: 1 } } });

  return NextResponse.json({ success: true });
}
