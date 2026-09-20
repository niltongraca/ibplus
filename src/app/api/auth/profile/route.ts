import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parseBody } from "@/lib/validations/helpers";
import { profileUpdateSchema } from "@/lib/validations/auth";

export async function PUT(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = await parseBody(request, profileUpdateSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const updateData: Record<string, string> = {};

  if (body.name !== undefined) {
    updateData.name = body.name;
  }
  if (body.avatar !== undefined) {
    updateData.avatar = body.avatar;
  }
  if (body.coverPhoto !== undefined) {
    updateData.coverPhoto = body.coverPhoto;
  }
  if (body.phone !== undefined) {
    updateData.phone = body.phone;
  }

  await prisma.user.update({ where: { id: user.id }, data: updateData });
  return NextResponse.json({ success: true });
}
