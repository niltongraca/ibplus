import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { parseDateOnly, parsePagination, buildSearch } from "@/lib/utils";
import { requireFeature, requireTeamManage } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { vacationCreateSchema } from "@/lib/validations/rh";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const denied = await requireFeature(user, "rh"); if (denied) return denied;

    const url = new URL(request.url);
    const { page, limit, skip } = parsePagination(url.searchParams);
    const search = buildSearch(["employee.name"], url.searchParams.get("search"));
    const status = url.searchParams.get("status") ?? undefined;
    const where = {
      employee: { companyId: user.companyId },
      ...(search ?? {}),
      ...(status ? { status } : {}),
    };

    const [vacations, total] = await Promise.all([
      prisma.vacation.findMany({
        where,
        include: { employee: { select: { name: true } } },
        orderBy: { startDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.vacation.count({ where }),
    ]);

    return NextResponse.json({ vacations, total, page, totalPages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar férias." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const denied = await requireTeamManage(user); if (denied) return denied;

  try {
    const parsed = await parseBody(request, vacationCreateSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;

    const employeeId = body.employeeId;

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId: user.companyId },
    });
    if (!employee) return NextResponse.json({ error: "Funcionário não encontrado." }, { status: 404 });

    const startDate = body.startDate ? (parseDateOnly(body.startDate) ?? new Date(body.startDate)) : null;
    if (!startDate || isNaN(startDate.getTime())) return NextResponse.json({ error: "A data de início não é válida." }, { status: 400 });

    const endDate = body.endDate ? (parseDateOnly(body.endDate) ?? new Date(body.endDate)) : null;
    if (!endDate || isNaN(endDate.getTime())) return NextResponse.json({ error: "A data de fim não é válida." }, { status: 400 });

    if (endDate < startDate) return NextResponse.json({ error: "A data de fim deve ser posterior à de início." }, { status: 400 });

    const status = body.status ?? "pending";
    const notes = body.notes || null;

    const vacation = await prisma.vacation.create({
      data: { employeeId, startDate, endDate, status, notes },
    });
    await logAction("create", "vacation", vacation.id, `Férias para "${employee.name}" solicitadas`, user);
    return NextResponse.json({ vacation }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const error = /funcionário|data|deve ser posterior/.test(message) ? message : "Erro ao criar período de férias.";
    return NextResponse.json({ error }, { status: 400 });
  }
}
