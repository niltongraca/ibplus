import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user || !user.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const company = await prisma.company.findUnique({ where: { id: user.companyId } });
  return NextResponse.json({ company });
}

export async function PUT(request: Request) {
  const user = await getAuthUser();
  if (!user || !user.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { name, nif, phone, address } = await request.json();
  await prisma.company.update({
    where: { id: user.companyId },
    data: { name, nif, phone, address },
  });

  return NextResponse.json({ success: true });
}
