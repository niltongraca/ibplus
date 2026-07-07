import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  const resources = await prisma.resource.findMany({
    orderBy: { label: "asc" },
  });

  return NextResponse.json({ resources });
}

export async function PUT(request: Request) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  try {
    const { id, enabled } = await request.json();
    await prisma.resource.update({ where: { id }, data: { enabled } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao actualizar recurso." }, { status: 500 });
  }
}
