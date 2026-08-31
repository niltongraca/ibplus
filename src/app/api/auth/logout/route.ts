import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("ibplus_session")?.value;

    if (token) {
      const payload = verifyToken(token);
      if (payload?.userId) {
        await prisma.user.update({
          where: { id: payload.userId },
          data: { tokenVersion: { increment: 1 } },
        });
      }
    }
  } catch {
    // Não falhamos o logout por erro de revogação — o cookie é apagado de qualquer forma.
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("ibplus_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
