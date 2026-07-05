"use client";

import { useState, useEffect } from "react";
import { Star, Search, Users, Gift, Award, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  totalSales?: number;
}

export default function FidelizacaoPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/sales").then((r) => r.json()),
    ]).then(([cData, sData]) => {
      const custList = cData.customers || [];
      const salesList = sData.sales || [];
      const salesByCustomer: Record<string, number> = {};
      salesList.forEach((s: any) => {
        if (s.customerId) {
          salesByCustomer[s.customerId] = (salesByCustomer[s.customerId] || 0) + s.total;
        }
      });
      setCustomers(custList.map((c: Customer) => ({ ...c, totalSales: salesByCustomer[c.id] || 0 })));
      setSales(salesList);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const topCustomers = [...customers].sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0));
  const filtered = topCustomers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ib-primary">Fidelização</h1>
        <p className="text-ib-muted text-sm">Programa de fidelização e análise de clientes</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Clientes", value: customers.length, icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: "Receita Total", value: formatCurrency(sales.reduce((s: number, sa: any) => s + sa.total, 0)), icon: TrendingUp, color: "bg-green-50 text-green-600" },
          { label: "Ticket Médio", value: customers.length > 0 ? formatCurrency(sales.reduce((s: number, sa: any) => s + sa.total, 0) / Math.max(customers.length, 1)) : "0 Kz", icon: Award, color: "bg-purple-50 text-purple-600" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-ib-primary">{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Pesquisar clientes..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
          <span className="text-xs text-ib-muted font-medium flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" /> Top clientes por valor</span>
        </div>
        <DataTable
          columns={[
            { key: "name", header: "Cliente", render: (c: Customer) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center text-xs font-bold text-yellow-700">{c.name.charAt(0)}</div>
                <div>
                  <span className="font-medium text-ib-primary">{c.name}</span>
                  {c.email && <p className="text-xs text-ib-muted">{c.email}</p>}
                </div>
              </div>
            )},
            { key: "phone", header: "Telefone", hide: "tablet", render: (c: Customer) => <span className="text-ib-muted">{c.phone || "—"}</span> },
            { key: "totalSales", header: "Total Gasto", className: "text-right", render: (c: Customer) => (
              <span className="font-semibold text-ib-accent">{c.totalSales ? formatCurrency(c.totalSales) : "0 Kz"}</span>
            )},
          ]}
          data={filtered}
          loading={loading}
          emptyIcon={<Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhum cliente encontrado."
          keyExtractor={(c: Customer) => c.id}
          mobileCard={(c: Customer) => (
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-ib-primary">{c.name}</p>
                <p className="text-xs text-ib-muted">{c.email || c.phone || "—"}</p>
              </div>
              <p className="font-semibold text-ib-accent">{c.totalSales ? formatCurrency(c.totalSales) : "0 Kz"}</p>
            </div>
          )}
        />
      </div>
    </div>
  );
}
