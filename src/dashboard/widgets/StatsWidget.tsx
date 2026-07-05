"use client";

import { DollarSign, ShoppingCart, Users, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface StatsData {
  totalRevenue: number;
  todaySales: number;
  totalCustomers: number;
  totalProducts: number;
  productsLowStock: number;
}

export function StatsWidget({ data }: { data: StatsData | null }) {
  if (!data) return null;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard icon={DollarSign} label="Receita Total" value={formatCurrency(data.totalRevenue)} color="green" sub={data.todaySales > 0 ? `+${formatCurrency(data.todaySales)} hoje` : undefined} />
      <StatCard icon={ShoppingCart} label="Vendas" value={String(data.totalProducts)} color="blue" />
      <StatCard icon={Users} label="Clientes" value={String(data.totalCustomers)} color="purple" />
      <StatCard icon={Package} label="Produtos" value={String(data.totalProducts)} color="orange" sub={data.productsLowStock > 0 ? `${data.productsLowStock} com stock crítico` : undefined} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: string; color: string; sub?: string }) {
  const colors: Record<string, string> = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center`}><Icon className="w-5 h-5" /></div>
        <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-ib-primary">{value}</p>
      {sub && <p className={`text-xs mt-1 ${sub.includes("crítico") ? "text-red-500" : "text-green-600"}`}>{sub}</p>}
    </div>
  );
}
