import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PUT(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json();
  const updateData: Record<string, string> = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "O nome não pode ficar vazio." }, { status: 400 });
    updateData.name = name;
  }
  if (body.avatar !== undefined) {
    const avatar = typeof body.avatar === "string" ? body.avatar.trim() : "";
    updateData.avatar = avatar || "";
  }
  if (body.phone !== undefined) {
    updateData.phone = typeof body.phone === "string" ? body.phone.trim() : "";
  }

  await prisma.user.update({ where: { id: user.id }, data: updateData });
  return NextResponse.json({ success: true });
}
