"use client";

import { DollarSign, TrendingUp, TrendingDown, ShoppingCart, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { DashboardData } from "../DashboardRenderer";

export function KPIWidget({ data }: { data: DashboardData | null }) {
  if (!data) return null;

  const netProfit = data.totalRevenue - data.totalExpenses;
  const monthNet = data.todaySales - data.monthExpenses;
  const profitMargin = data.totalRevenue > 0 ? ((netProfit / data.totalRevenue) * 100) : 0;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KPICard
        icon={DollarSign}
        label="Receita Total"
        value={formatCurrency(data.totalRevenue)}
        sub={`${formatCurrency(data.todaySales)} hoje`}
        color="green"
        trend={data.todaySales > 0 ? "up" : undefined}
      />
      <KPICard
        icon={TrendingDown}
        label="Despesas Total"
        value={formatCurrency(data.totalExpenses)}
        sub={`${formatCurrency(data.monthExpenses)} este mês`}
        color="red"
      />
      <KPICard
        icon={TrendingUp}
        label="Lucro Líquido"
        value={formatCurrency(netProfit)}
        sub={`${profitMargin.toFixed(1)}% margem`}
        color={netProfit >= 0 ? "blue" : "red"}
        trend={monthNet > 0 ? "up" : monthNet < 0 ? "down" : undefined}
      />
      <KPICard
        icon={ShoppingCart}
        label="Ticket Médio"
        value={formatCurrency(data.averageSaleValue)}
        sub={`${data.totalSales} vendas`}
        color="purple"
      />
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, color, trend }: {
  icon: any; label: string; value: string; sub?: string; color: string; trend?: "up" | "down";
}) {
  const colors: Record<string, string> = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {trend === "up" ? "+Hoje" : "-Hoje"}
          </span>
        )}
      </div>
      <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</span>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
