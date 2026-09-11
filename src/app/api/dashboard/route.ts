import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { toNumber } from "@/lib/money";
import { startOfTodayUtc } from "@/lib/utils";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    if (!user.companyId) {
      return NextResponse.json({
        totalRevenue: 0, todaySales: 0, totalCustomers: 0, totalProducts: 0,
        pendingInvoices: 0, pendingInvoicesTotal: 0, productsLowStock: 0,
        recentSales: [], recentClients: [], totalEmployees: 0, totalServices: 0,
        lowStockProducts: [], totalDonations: 0, donationTotal: 0, totalStudents: 0,
        activeCampaigns: 0, totalSales: 0, monthlySales: [], monthlyFunds: [], categorySales: [],
        totalExpenses: 0, monthExpenses: 0, pendingQuotes: 0, pendingQuotesTotal: 0,
        activeEmployees: 0, vacationPending: 0, averageSaleValue: 0,
        conversionRate: 0, totalOpportunities: 0, wonOpportunities: 0,
        recentExpenses: [], topProducts: [], totalIncome: 0, totalExpense: 0, balance: 0,
      });
    }

    const today = startOfTodayUtc();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const thisMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

    const [
      totalSales, todaySalesAgg, totalCustomers, totalProducts,
      pendingInvoicesAgg, productsLow, recentSales,
      recentClients, totalEmployees, totalServices,
      lowStock, totalDonationsAgg, activeCampaigns,
      totalStudents, sales6Months, transactions6Months, salesWithItems, totalSalesCount,
      totalExpensesAgg, monthExpensesAgg, pendingQuotesAgg,
      activeEmployeesCount, vacationPendingCount,
      totalOppsAgg, wonOppsAgg, recentExpenses,
      topProductsData, incomeAgg, expenseAgg,
    ] = await Promise.all([
      prisma.sale.aggregate({ where: { companyId: user.companyId, status: { not: "cancelled" } }, _sum: { total: true } }),
      prisma.sale.aggregate({ where: { companyId: user.companyId, status: { not: "cancelled" }, date: { gte: today } }, _sum: { total: true } }),
      prisma.customer.count({ where: { companyId: user.companyId } }),
      prisma.product.count({ where: { companyId: user.companyId } }),
      prisma.invoice.aggregate({ where: { companyId: user.companyId, status: { in: ["pending", "partially_paid"] } }, _count: true, _sum: { total: true, paidAmount: true } }),
      prisma.product.count({ where: { companyId: user.companyId, stock: { lte: 5 } } }),
      prisma.sale.findMany({
        where: { companyId: user.companyId, status: { not: "cancelled" } },
        orderBy: { date: "desc" },
        take: 5,
        include: { customer: { select: { name: true } } },
      }),
      prisma.customer.findMany({
        where: { companyId: user.companyId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.employee.count({ where: { companyId: user.companyId, active: true } }),
      prisma.service.count({ where: { companyId: user.companyId } }),
      prisma.product.findMany({
        where: { companyId: user.companyId, stock: { lte: 5 } },
        orderBy: { stock: "asc" },
        take: 5,
        select: { id: true, name: true, stock: true, minStock: true },
      }),
      prisma.sale.aggregate({
        where: { companyId: user.companyId, paymentMethod: "donation", status: { not: "cancelled" } },
        _count: true,
        _sum: { total: true },
      }),
      prisma.campaign.count({ where: { companyId: user.companyId, status: "active" } }),
      prisma.student.count({ where: { companyId: user.companyId } }),
      prisma.sale.findMany({
        where: { companyId: user.companyId, date: { gte: sixMonthsAgo }, status: { not: "cancelled" } },
        select: { total: true, date: true },
        orderBy: { date: "asc" },
      }),
      prisma.transaction.findMany({
        where: { companyId: user.companyId, date: { gte: sixMonthsAgo } },
        select: { type: true, amount: true, date: true },
        orderBy: { date: "asc" },
      }),
      prisma.saleItem.findMany({
        where: { sale: { companyId: user.companyId, date: { gte: sixMonthsAgo }, status: { not: "cancelled" } } },
        include: { product: { include: { category: { select: { name: true } } } } },
      }),
      prisma.sale.count({ where: { companyId: user.companyId, status: { not: "cancelled" } } }),
      prisma.expense.aggregate({ where: { companyId: user.companyId }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { companyId: user.companyId, date: { gte: thisMonth } }, _sum: { amount: true } }),
      prisma.quote.aggregate({ where: { companyId: user.companyId, status: "pending" }, _count: true, _sum: { total: true } }),
      prisma.employee.count({ where: { companyId: user.companyId, active: true } }),
      prisma.vacation.count({ where: { employee: { companyId: user.companyId }, status: "pending" } }),
      prisma.opportunity.aggregate({ where: { companyId: user.companyId }, _count: true }),
      prisma.opportunity.aggregate({ where: { companyId: user.companyId, stage: "won" }, _count: true }),
      prisma.expense.findMany({
        where: { companyId: user.companyId },
        orderBy: { date: "desc" },
        take: 5,
      }),
      prisma.saleItem.findMany({
        where: { sale: { companyId: user.companyId, status: { not: "cancelled" } } },
        include: { product: { select: { name: true } } },
        orderBy: { total: "desc" },
        take: 5,
      }),
      prisma.transaction.aggregate({ where: { companyId: user.companyId, type: "income" }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { companyId: user.companyId, type: "expense" }, _sum: { amount: true } }),
    ]);

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const monthlyMap = new Map<string, { total: number; count: number }>();
    for (const sale of sales6Months) {
      const key = `${sale.date.getFullYear()}-${String(sale.date.getMonth() + 1).padStart(2, "0")}`;
      const existing = monthlyMap.get(key) || { total: 0, count: 0 };
      existing.total += toNumber(sale.total);
      existing.count++;
      monthlyMap.set(key, existing);
    }

    const fundMap = new Map<string, { income: number; expense: number }>();
    for (const t of transactions6Months) {
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
      const existing = fundMap.get(key) || { income: 0, expense: 0 };
      if (t.type === "income") existing.income += toNumber(t.amount);
      else existing.expense += toNumber(t.amount);
      fundMap.set(key, existing);
    }

    const now = new Date();
    const months: { key: string; month: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ key, month: `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(2)}` });
    }

    const monthlySales = months.map(({ key, month }) => {
      const val = monthlyMap.get(key) || { total: 0, count: 0 };
      return { month, total: val.total, count: val.count };
    });

    const monthlyFunds = months.map(({ key, month }) => {
      const val = fundMap.get(key) || { income: 0, expense: 0 };
      return { month, income: val.income, expense: val.expense, balance: val.income - val.expense };
    });

    const categoryMap = new Map<string, number>();
    for (const item of salesWithItems) {
      const catName = item.product?.category?.name || "Sem categoria";
      categoryMap.set(catName, (categoryMap.get(catName) || 0) + toNumber(item.total));
    }
    const categorySales = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

    const totalRevenue = toNumber(totalSales._sum.total);
    const totalOppCount = totalOppsAgg._count;
    const wonOppCount = wonOppsAgg._count;

    const topProductsMap = new Map<string, { name: string; quantity: number; total: number }>();
    for (const item of topProductsData) {
      const name = item.product?.name || "Produto";
      const existing = topProductsMap.get(name) || { name, quantity: 0, total: 0 };
      existing.quantity += item.quantity;
      existing.total += toNumber(item.total);
      topProductsMap.set(name, existing);
    }
    const topProducts = Array.from(topProductsMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return NextResponse.json({
      totalRevenue,
      todaySales: toNumber(todaySalesAgg._sum.total),
      totalCustomers,
      totalProducts,
      pendingInvoices: pendingInvoicesAgg._count,
      pendingInvoicesTotal: Math.max(0, toNumber(pendingInvoicesAgg._sum.total) - toNumber(pendingInvoicesAgg._sum.paidAmount)),
      productsLowStock: productsLow,
      recentSales: recentSales.map((s) => ({ ...s, total: toNumber(s.total) })),
      recentClients,
      totalEmployees,
      totalServices,
      lowStockProducts: lowStock,
      totalDonations: totalDonationsAgg._count,
      donationTotal: toNumber(totalDonationsAgg._sum.total),
      totalStudents,
      activeCampaigns,
      totalSales: totalSalesCount,
      monthlySales,
      monthlyFunds,
      categorySales,
      totalExpenses: toNumber(totalExpensesAgg._sum.amount),
      monthExpenses: toNumber(monthExpensesAgg._sum.amount),
      pendingQuotes: pendingQuotesAgg._count,
      pendingQuotesTotal: toNumber(pendingQuotesAgg._sum.total),
      activeEmployees: activeEmployeesCount,
      vacationPending: vacationPendingCount,
      averageSaleValue: totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0,
      conversionRate: totalOppCount > 0 ? (wonOppCount / totalOppCount) * 100 : 0,
      totalOpportunities: totalOppCount,
      wonOpportunities: wonOppCount,
      recentExpenses: recentExpenses.map((e) => ({ ...e, amount: toNumber(e.amount) })),
      topProducts,
      totalIncome: toNumber(incomeAgg._sum.amount),
      totalExpense: toNumber(expenseAgg._sum.amount),
      balance: toNumber(incomeAgg._sum.amount) - toNumber(expenseAgg._sum.amount),
    });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar dashboard." }, { status: 500 });
  }
}
