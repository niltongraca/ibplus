import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PUT(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });

  await prisma.user.update({ where: { id: user.id }, data: { name } });
  return NextResponse.json({ success: true });
}
