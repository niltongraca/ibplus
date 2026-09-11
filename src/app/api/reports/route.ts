import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { generateReportForCompany, type ReportPeriod } from "@/lib/reports";
import { toNumber } from "@/lib/money";

function serializeReport(r: { totalRevenue?: unknown; totalExpenses?: unknown; netResult?: unknown; invoicesPaidTotal?: unknown } & Record<string, unknown>) {
  return {
    ...r,
    totalRevenue: toNumber(r.totalRevenue),
    totalExpenses: toNumber(r.totalExpenses),
    netResult: toNumber(r.netResult),
    invoicesPaidTotal: toNumber(r.invoicesPaidTotal),
  };
}

export async function GET() {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const reports = await prisma.report.findMany({
    where: { companyId: user.companyId },
    orderBy: [{ period: "asc" }, { periodKey: "desc" }],
  });

  return NextResponse.json({ reports: reports.map((r) => serializeReport(r as never)) });
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