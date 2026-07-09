import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where: { companyId: user.companyId },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.employee.count({ where: { companyId: user.companyId } }),
  ]);

  return NextResponse.json({ employees, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const data = await request.json();
    const employee = await prisma.employee.create({
      data: { ...data, companyId: user.companyId },
    });
    await logAction("create", "employee", employee.id, `Funcionário "${employee.name}" criado`);
    return NextResponse.json({ employee }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar funcionário." }, { status: 400 });
  }
}
