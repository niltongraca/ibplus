import { prisma } from "@/lib/prisma";

const MONTHS_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export type ReportPeriod = "monthly" | "quarterly" | "annual";

interface PeriodInfo {
  period: string;
  periodKey: string;
  label: string;
  start: Date;
  end: Date;
}

function pad(v: number): string {
  return String(v).padStart(2, "0");
}

export function getPeriodInfo(period: ReportPeriod, now: Date): PeriodInfo {
  if (period === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);
    const key = `${start.getFullYear()}-${pad(start.getMonth() + 1)}`;
    return {
      period: "MENSAL",
      periodKey: key,
      label: `${MONTHS_PT[start.getMonth()]} ${start.getFullYear()}`,
      start,
      end,
    };
  }

  if (period === "quarterly") {
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const quarter = Math.floor(prevMonth.getMonth() / 3);
    const start = new Date(prevMonth.getFullYear(), quarter * 3, 1);
    const end = new Date(prevMonth.getFullYear(), quarter * 3 + 3, 1);
    const ordinals = ["1.º", "2.º", "3.º", "4.º"];
    return {
      period: "TRIMESTRAL",
      periodKey: `${start.getFullYear()}-Q${quarter + 1}`,
      label: `${ordinals[quarter]} Trimestre ${start.getFullYear()}`,
      start,
      end,
    };
  }

  const start = new Date(now.getFullYear() - 1, 0, 1);
  const end = new Date(now.getFullYear(), 0, 1);
  return {
    period: "ANUAL",
    periodKey: `${start.getFullYear()}`,
    label: `Ano ${start.getFullYear()}`,
    start,
    end,
  };
}

export async function generateReportForCompany(companyId: string, period: ReportPeriod, now: Date = new Date()) {
  const info = getPeriodInfo(period, now);

  const [salesAgg, salesCount, expenseAgg, paidAgg] = await Promise.all([
    prisma.sale.aggregate({
      where: { companyId, date: { gte: info.start, lt: info.end } },
      _sum: { total: true },
    }),
    prisma.sale.count({
      where: { companyId, date: { gte: info.start, lt: info.end }, status: { not: "cancelled" } },
    }),
    prisma.expense.aggregate({
      where: { companyId, date: { gte: info.start, lt: info.end } },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { companyId, status: "paid", date: { gte: info.start, lt: info.end } },
      _count: true,
      _sum: { total: true },
    }),
  ]);

  const [recentSales, recentExpenses] = await Promise.all([
    prisma.sale.findMany({
      where: { companyId, date: { gte: info.start, lt: info.end } },
      orderBy: { date: "desc" },
      take: 20,
      include: { customer: { select: { name: true } } },
    }),
    prisma.expense.findMany({
      where: { companyId, date: { gte: info.start, lt: info.end } },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);

  const totalRevenue = salesAgg._sum.total || 0;
  const totalExpenses = expenseAgg._sum.amount || 0;
  const invoicesPaid = paidAgg._count;
  const invoicesPaidTotal = paidAgg._sum.total || 0;
  const netResult = totalRevenue + invoicesPaidTotal - totalExpenses;

  const data = {
    recentSales: recentSales.map((s) => ({
      id: s.id,
      date: s.date,
      total: s.total,
      customer: s.customer?.name ?? null,
    })),
    recentExpenses: recentExpenses.map((e) => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      date: e.date,
      category: e.category,
    })),
  };

  const report = await prisma.report.upsert({
    where: {
      companyId_period_periodKey: {
        companyId,
        period: info.period,
        periodKey: info.periodKey,
      },
    },
    update: {
      label: info.label,
      data,
      totalRevenue,
      totalExpenses,
      netResult,
      totalSales: salesCount,
      invoicesPaid,
      invoicesPaidTotal,
    },
    create: {
      companyId,
      period: info.period,
      periodKey: info.periodKey,
      label: info.label,
      data,
      totalRevenue,
      totalExpenses,
      netResult,
      totalSales: salesCount,
      invoicesPaid,
      invoicesPaidTotal,
    },
  });

  return report;
}

export async function generateReportsForAllCompanies(period: ReportPeriod, now: Date = new Date()) {
  const companies = await prisma.company.findMany({ select: { id: true } });
  const results: Awaited<ReturnType<typeof generateReportForCompany>>[] = [];
  for (const company of companies) {
    try {
      results.push(await generateReportForCompany(company.id, period, now));
    } catch (err) {
      console.error(`Erro ao gerar relatório ${period} para ${company.id}:`, err);
    }
  }
  return results;
}