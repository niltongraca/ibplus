import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { toNumber } from "@/lib/money";
import { requireFeature } from "@/lib/permissions";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const denied = await requireFeature(user, "relatorios"); if (denied) return denied;

    const companyId = user.companyId;

    const [sales, invoices, services, products] = await Promise.all([
      prisma.sale.findMany({
        where: { companyId, status: { not: "cancelled" } },
        select: {
          total: true,
          customer: { select: { name: true } },
          items: {
            select: {
              quantity: true,
              unitPrice: true,
              total: true,
              product: { select: { name: true } },
            },
          },
        },
      }),
      prisma.invoice.findMany({
        where: { companyId },
        select: {
          customer: true,
          total: true,
          items: { select: { description: true, quantity: true, unitPrice: true, total: true } },
        },
      }),
      prisma.service.findMany({ where: { companyId }, select: { name: true } }),
      prisma.product.findMany({ where: { companyId }, select: { id: true, name: true } }),
    ]);

    const serviceNames = new Set(services.map((s) => s.name.toLowerCase()));
    const productNames = new Set(products.map((p) => p.name.toLowerCase()));

    interface ItemAgg {
      name: string;
      kind: string;
      quantity: number;
      revenue: number;
      times: number;
      customers: Set<string>;
    }

    const itemMap = new Map<string, ItemAgg>();
    const customerMap = new Map<
      string,
      { label: string; spent: number; orders: number; items: { name: string; quantity: number; revenue: number }[] }
    >();

    function addItem(name: string, quantity: number, revenue: number, customer: string) {
      const key = name.toLowerCase();
      const existing = itemMap.get(key) || { name, kind: "outro", quantity: 0, revenue: 0, times: 0, customers: new Set<string>() };
      existing.name = name;
      existing.quantity += quantity;
      existing.revenue += revenue;
      existing.times += 1;
      if (existing.kind === "outro" && (serviceNames.has(key) || productNames.has(key))) {
        existing.kind = serviceNames.has(key) ? "serviço" : "produto";
      }
      existing.customers.add(customer);
      itemMap.set(key, existing);
    }

    function addCustomerSpend(label: string, spent: number) {
      const key = label.toLowerCase();
      const existing = customerMap.get(key) || { label, spent: 0, orders: 0, items: [] };
      existing.spent += spent;
      existing.orders += 1;
      customerMap.set(key, existing);
    }

    function addCustomerItem(label: string, itemName: string, quantity: number, revenue: number) {
      const key = label.toLowerCase();
      const existing = customerMap.get(key) || { label, spent: 0, orders: 0, items: [] };
      const it = existing.items.find((x) => x.name.toLowerCase() === itemName.toLowerCase());
      if (it) {
        it.quantity += quantity;
        it.revenue += revenue;
      } else {
        existing.items.push({ name: itemName, quantity, revenue });
      }
      customerMap.set(key, existing);
    }

    for (const sale of sales) {
      const customer = sale.customer?.name || "Cliente ocasional";
      for (const item of sale.items) {
        const name = item.product?.name || "Produto";
        addItem(name, item.quantity, toNumber(item.total), customer);
        addCustomerItem(customer, name, item.quantity, toNumber(item.total));
      }
      addCustomerSpend(customer, toNumber(sale.total));
    }

    for (const invoice of invoices) {
      const customer = invoice.customer || "Cliente ocasional";
      for (const item of invoice.items) {
        const name = item.description || "Sem nome";
        addItem(name, item.quantity, toNumber(item.total), customer);
        addCustomerItem(customer, name, item.quantity, toNumber(item.total));
      }
      addCustomerSpend(customer, toNumber(invoice.total));
    }

    const itemsReport = Array.from(itemMap.values())
      .map((agg) => ({
        name: agg.name,
        kind: agg.kind,
        times: agg.times,
        quantity: agg.quantity,
        revenue: agg.revenue,
        customerCount: agg.customers.size,
        customers: Array.from(agg.customers),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const customersReport = Array.from(customerMap.values())
      .map((c) => ({ ...c, itemCount: c.items.length }))
      .sort((a, b) => b.spent - a.spent);

    return NextResponse.json({ items: itemsReport, customers: customersReport });
  } catch {
    return NextResponse.json({ error: "Erro ao gerar análise de clientes e produtos." }, { status: 500 });
  }
}