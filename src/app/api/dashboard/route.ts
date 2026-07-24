import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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
        activeCampaigns: 0, totalSales: 0, monthlySales: [], categorySales: [],
        totalExpenses: 0, monthExpenses: 0, pendingQuotes: 0, pendingQuotesTotal: 0,
        activeEmployees: 0, vacationPending: 0, averageSaleValue: 0,
        conversionRate: 0, totalOpportunities: 0, wonOpportunities: 0,
        recentExpenses: [], topProducts: [],
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalSales, todaySalesAgg, totalCustomers, totalProducts,
      pendingInvoicesAgg, productsLow, recentSales,
      recentClients, totalEmployees, totalServices,
      lowStock, totalDonationsAgg, activeCampaigns,
      totalStudents, sales6Months, salesWithItems, totalSalesCount,
      totalExpensesAgg, monthExpensesAgg, pendingQuotesAgg,
      activeEmployeesCount, vacationPendingCount,
      totalOppsAgg, wonOppsAgg, recentExpenses,
      topProductsData,
    ] = await Promise.all([
      prisma.sale.aggregate({ where: { companyId: user.companyId }, _sum: { total: true } }),
      prisma.sale.aggregate({ where: { companyId: user.companyId, date: { gte: today } }, _sum: { total: true } }),
      prisma.customer.count({ where: { companyId: user.companyId } }),
      prisma.product.count({ where: { companyId: user.companyId } }),
      prisma.invoice.aggregate({ where: { companyId: user.companyId, status: { in: ["draft", "sent"] } }, _count: true, _sum: { total: true } }),
      prisma.product.count({ where: { companyId: user.companyId, stock: { lte: 5 } } }),
      prisma.sale.findMany({
        where: { companyId: user.companyId },
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
        where: { companyId: user.companyId, paymentMethod: "donation" },
        _count: true,
        _sum: { total: true },
      }),
      prisma.campaign.count({ where: { companyId: user.companyId, status: "active" } }),
      prisma.student.count({ where: { companyId: user.companyId } }),
      prisma.sale.findMany({
        where: { companyId: user.companyId, date: { gte: sixMonthsAgo } },
        select: { total: true, date: true },
        orderBy: { date: "asc" },
      }),
      prisma.saleItem.findMany({
        where: { sale: { companyId: user.companyId, date: { gte: sixMonthsAgo } } },
        include: { product: { include: { category: { select: { name: true } } } } },
      }),
      prisma.sale.count({ where: { companyId: user.companyId } }),
      prisma.expense.aggregate({ where: { companyId: user.companyId }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { companyId: user.companyId, date: { gte: thisMonth } }, _sum: { amount: true } }),
      prisma.quote.aggregate({ where: { companyId: user.companyId, status: { in: ["draft", "sent"] } }, _count: true, _sum: { total: true } }),
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
        where: { sale: { companyId: user.companyId } },
        include: { product: { select: { name: true } } },
        orderBy: { total: "desc" },
        take: 5,
      }),
    ]);

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const monthlyMap = new Map<string, { total: number; count: number }>();
    for (const sale of sales6Months) {
      const key = `${sale.date.getFullYear()}-${String(sale.date.getMonth() + 1).padStart(2, "0")}`;
      const existing = monthlyMap.get(key) || { total: 0, count: 0 };
      existing.total += sale.total;
      existing.count++;
      monthlyMap.set(key, existing);
    }
    const monthlySales = Array.from(monthlyMap.entries()).map(([key, val]) => {
      const [y, m] = key.split("-");
      return { month: `${monthNames[parseInt(m) - 1]}/${y?.slice(2)}`, total: val.total, count: val.count };
    });

    const categoryMap = new Map<string, number>();
    for (const item of salesWithItems) {
      const catName = item.product?.category?.name || "Sem categoria";
      categoryMap.set(catName, (categoryMap.get(catName) || 0) + item.total);
    }
    const categorySales = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

    const totalRevenue = totalSales._sum.total || 0;
    const totalOppCount = totalOppsAgg._count;
    const wonOppCount = wonOppsAgg._count;

    const topProductsMap = new Map<string, { name: string; quantity: number; total: number }>();
    for (const item of topProductsData) {
      const name = item.product?.name || "Produto";
      const existing = topProductsMap.get(name) || { name, quantity: 0, total: 0 };
      existing.quantity += item.quantity;
      existing.total += item.total;
      topProductsMap.set(name, existing);
    }
    const topProducts = Array.from(topProductsMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return NextResponse.json({
      totalRevenue,
      todaySales: todaySalesAgg._sum.total || 0,
      totalCustomers,
      totalProducts,
      pendingInvoices: pendingInvoicesAgg._count,
      pendingInvoicesTotal: pendingInvoicesAgg._sum.total || 0,
      productsLowStock: productsLow,
      recentSales,
      recentClients,
      totalEmployees,
      totalServices,
      lowStockProducts: lowStock,
      totalDonations: totalDonationsAgg._count,
      donationTotal: totalDonationsAgg._sum.total || 0,
      totalStudents,
      activeCampaigns,
      totalSales: totalSalesCount,
      monthlySales,
      categorySales,
      totalExpenses: totalExpensesAgg._sum.amount || 0,
      monthExpenses: monthExpensesAgg._sum.amount || 0,
      pendingQuotes: pendingQuotesAgg._count,
      pendingQuotesTotal: pendingQuotesAgg._sum.total || 0,
      activeEmployees: activeEmployeesCount,
      vacationPending: vacationPendingCount,
      averageSaleValue: totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0,
      conversionRate: totalOppCount > 0 ? (wonOppCount / totalOppCount) * 100 : 0,
      totalOpportunities: totalOppCount,
      wonOpportunities: wonOppCount,
      recentExpenses,
      topProducts,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar dashboard." }, { status: 500 });
  }
}
