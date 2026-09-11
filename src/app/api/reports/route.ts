import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { generateReportForCompany, type ReportPeriod } from "@/lib/reports";
import { toNumber } from "@/lib/money";
import { parsePagination } from "@/lib/utils";

function serializeReport(r: { totalRevenue?: unknown; totalExpenses?: unknown; netResult?: unknown; invoicesPaidTotal?: unknown } & Record<string, unknown>) {
  return {
    ...r,
    totalRevenue: toNumber(r.totalRevenue),
    totalExpenses: toNumber(r.totalExpenses),
    netResult: toNumber(r.netResult),
    invoicesPaidTotal: toNumber(r.invoicesPaidTotal),
  };
}

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const url = new URL(request.url);
  const { page, limit, skip } = parsePagination(url.searchParams);
  const where = { companyId: user.companyId };

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: [{ period: "asc" }, { periodKey: "desc" }],
      skip,
      take: limit,
    }),
    prisma.report.count({ where }),
  ]);

  return NextResponse.json({
    reports: reports.map((r) => serializeReport(r as never)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const period: ReportPeriod = body.period === "quarterly" || body.period === "annual" ? body.period : "monthly";

  const report = await generateReportForCompany(user.companyId, period);

  await logAction("create", "report", report.id, `Relatório ${report.period} "${report.label}" gerado`);
  return NextResponse.json({ report: serializeReport(report as never) }, { status: 201 });
}