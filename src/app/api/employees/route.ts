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
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "O nome é obrigatório." }, { status: 400 });

    const email = body.email ? String(body.email).trim() : "";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "O email não é válido." }, { status: 400 });
    }

    const salary = body.salary === undefined || body.salary === null || body.salary === "" ? 0 : Number(body.salary);
    if (!Number.isFinite(salary) || salary < 0) {
      return NextResponse.json({ error: "O salário não pode ser negativo." }, { status: 400 });
    }

    let hireDate: Date | null = null;
    if (body.hireDate) {
      hireDate = new Date(body.hireDate);
      if (isNaN(hireDate.getTime())) return NextResponse.json({ error: "A data de admissão não é válida." }, { status: 400 });
    }

    const employee = await prisma.employee.create({
      data: {
        companyId: user.companyId,
        name,
        email: email || null,
        phone: body.phone ? String(body.phone).trim() : null,
        position: body.position ? String(body.position).trim() : null,
        salary,
        hireDate,
        active: body.active === false ? false : true,
      },
    });
    await logAction("create", "employee", employee.id, `Funcionário "${employee.name}" criado`);
    return NextResponse.json({ employee }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar funcionário." }, { status: 400 });
  }
}
