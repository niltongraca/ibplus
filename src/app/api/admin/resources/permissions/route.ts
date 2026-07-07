import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  const permissions = await prisma.resourcePermission.findMany({
    include: { resource: { select: { key: true, label: true } } },
    orderBy: [{ resourceId: "asc" }, { accountType: "asc" }],
  });

  return NextResponse.json({ permissions });
}

export async function PUT(request: Request) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  try {
    const { id, allowed } = await request.json();
    await prisma.resourcePermission.update({ where: { id }, data: { allowed } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao actualizar permissão." }, { status: 500 });
  }
}
