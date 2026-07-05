import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Email ou senha inválidos." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Email ou senha inválidos." }, { status: 401 });
    }

    const token = signToken({ userId: user.id, companyId: user.companyId, email: user.email, role: user.role });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, tipo: user.tipo, companyId: user.companyId, role: user.role },
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
