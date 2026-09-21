import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parsePagination, parseDateOnly, buildSearch, parseBool } from "@/lib/utils";
import { logAction } from "@/lib/audit";
import { toNumber } from "@/lib/money";
import { requireFeature, requireTeamManage } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { employeeCreateSchema } from "@/lib/validations/rh";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireFeature(user, "rh"); if (denied) return denied;

  const url = new URL(request.url);
  const { page, limit, skip } = parsePagination(url.searchParams);
  const all = url.searchParams.get("all") === "true";
  const search = buildSearch(["name", "email", "position"], url.searchParams.get("search"));
  const active = parseBool(url.searchParams.get("active"));
  const where = {
    companyId: user.companyId,
    ...(search ?? {}),
    ...(active !== undefined ? { active } : {}),
  };

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy: { name: "asc" },
      include: { cargo: { select: { id: true, name: true, level: true } } },
      ...(all ? {} : { skip, take: limit }),
    }),
    prisma.employee.count({ where }),
  ]);

  return NextResponse.json({
    employees: employees.map((e) => ({ ...e, salary: toNumber(e.salary) })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireTeamManage(user); if (denied) return denied;

  try {
    const parsed = await parseBody(request, employeeCreateSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;

    const name = body.name;
    const email = body.email || "";

    const salary = body.salary ?? 0;

    let hireDate: Date | null = null;
    if (body.hireDate) {
      hireDate = parseDateOnly(body.hireDate) ?? new Date(body.hireDate);
      if (isNaN(hireDate.getTime())) return NextResponse.json({ error: "A data de admissão não é válida." }, { status: 400 });
    }

    let cargoId: string | null = null;
    if (body.cargoId) {
      const cargo = await prisma.cargo.findFirst({
        where: { id: String(body.cargoId), companyId: user.companyId, active: true },
      });
      if (!cargo) return NextResponse.json({ error: "Cargo inválido." }, { status: 400 });
      cargoId = cargo.id;
    }

    const employee = await prisma.employee.create({
      data: {
        companyId: user.companyId,
        name,
        email: email || null,
        phone: body.phone || null,
        position: body.position || null,
        cargoId,
        salary,
        hireDate,
        active: body.active === false ? false : true,
      },
    });
    await logAction("create", "employee", employee.id, `Funcionário "${employee.name}" criado`, user);
    return NextResponse.json({ employee: { ...employee, salary: toNumber(employee.salary) } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar funcionário." }, { status: 400 });
  }
}
