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
        activeCampaigns: 0,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalSales, todaySalesAgg, totalCustomers, totalProducts,
      pendingInvoicesAgg, productsLow, recentSales,
      recentClients, totalEmployees, totalServices,
      lowStock, totalDonationsAgg, activeCampaigns,
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
    ]);

    return NextResponse.json({
      totalRevenue: totalSales._sum.total || 0,
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
      totalStudents: 0,
      activeCampaigns,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar dashboard." }, { status: 500 });
  }
}
