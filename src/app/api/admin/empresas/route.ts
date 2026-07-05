import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  const companies = await prisma.company.findMany({
    select: { id: true, name: true, nif: true, email: true, _count: { select: { users: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ companies });
}
