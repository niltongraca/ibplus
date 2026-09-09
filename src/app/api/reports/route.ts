import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { generateReportForCompany, type ReportPeriod } from "@/lib/reports";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const reports = await prisma.report.findMany({
    where: { companyId: user.companyId },
    orderBy: [{ period: "asc" }, { periodKey: "desc" }],
  });

  return NextResponse.json({ reports });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const period: ReportPeriod = body.period === "quarterly" || body.period === "annual" ? body.period : "monthly";

  const report = await generateReportForCompany(user.companyId, period);

  await logAction("create", "report", report.id, `Relatório ${report.period} "${report.label}" gerado`);
  return NextResponse.json({ report }, { status: 201 });
}