import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.companyId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalSales,
    todaySalesAgg,
    totalCustomers,
    totalProducts,
    pendingInvoicesAgg,
    productsLowStock,
    recentSales,
  ] = await Promise.all([
    prisma.sale.aggregate({ where: { companyId: user.companyId }, _sum: { total: true } }),
    prisma.sale.aggregate({ where: { companyId: user.companyId, date: { gte: today } }, _sum: { total: true } }),
    prisma.customer.count({ where: { companyId: user.companyId } }),
    prisma.product.count({ where: { companyId: user.companyId } }),
    prisma.invoice.aggregate({ where: { companyId: user.companyId, status: { in: ["draft", "sent"] } }, _count: true, _sum: { total: true } }),
    prisma.product.count({ where: { companyId: user.companyId, stock: { lte: 0 } } }),
    prisma.sale.findMany({
      where: { companyId: user.companyId },
      orderBy: { date: "desc" },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
  ]);

  return NextResponse.json({
    totalRevenue: totalSales._sum.total || 0,
    todaySales: todaySalesAgg._sum.total || 0,
    totalCustomers,
    totalProducts,
    pendingInvoices: pendingInvoicesAgg._count,
    pendingInvoicesTotal: pendingInvoicesAgg._sum.total || 0,
    productsLowStock,
    recentSales,
  });
}
