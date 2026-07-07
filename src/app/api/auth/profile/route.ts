import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PUT(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { name, avatar, phone } = await request.json();
  const updateData: Record<string, string> = {};
  if (name) updateData.name = name;
  if (avatar !== undefined) updateData.avatar = avatar;
  if (phone !== undefined) updateData.phone = phone;

  await prisma.user.update({ where: { id: user.id }, data: updateData });
  return NextResponse.json({ success: true });
}
