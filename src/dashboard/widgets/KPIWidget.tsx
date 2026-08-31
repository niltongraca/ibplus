"use client";

import { DollarSign, TrendingDown, TrendingUp, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { DashboardData } from "../DashboardRenderer";

export function KPIWidget({ data }: { data: DashboardData | null }) {
  if (!data) return null;

  const netProfit = data.totalRevenue - data.totalExpenses;
  const profitMargin = data.totalRevenue > 0 ? (netProfit / data.totalRevenue) * 100 : 0;
  const expenseRatio = data.totalRevenue > 0 ? (data.totalExpenses / data.totalRevenue) * 100 : 0;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <InfoCard
        icon={DollarSign}
        label="Receita Total"
        value={formatCurrency(data.totalRevenue)}
        sub="Total acumulado"
        color="blue"
        badge={`${formatCurrency(data.todaySales)} hoje`}
        badgeTone="positive"
      />
      <InfoCard
        icon={TrendingDown}
        label="Despesas Total"
        value={formatCurrency(data.totalExpenses)}
        sub={`${formatCurrency(data.monthExpenses)} este mês`}
        color="red"
        badge={`${expenseRatio.toFixed(0)}% receita`}
        badgeTone="neutral"
      />
      <InfoCard
        icon={TrendingUp}
        label="Lucro Líquido"
        value={formatCurrency(netProfit)}
        sub="Resultado global"
        color={netProfit >= 0 ? "green" : "red"}
        badge={`${profitMargin.toFixed(1)}% margem`}
        badgeTone={profitMargin >= 0 ? "positive" : "negative"}
      />
      <InfoCard
        icon={ShoppingCart}
        label="Ticket Médio"
        value={formatCurrency(data.averageSaleValue)}
        sub={`${data.totalSales} vendas`}
        color="purple"
        badge="por venda"
        badgeTone="neutral"
      />
    </div>
  );
}

const colorMap: Record<string, { box: string; icon: string; bar: string }> = {
  blue: { box: "bg-blue-100/70", icon: "text-blue-600", bar: "bg-blue-500" },
  green: { box: "bg-green-100/70", icon: "text-green-600", bar: "bg-green-500" },
  red: { box: "bg-red-100/70", icon: "text-red-600", bar: "bg-red-500" },
  purple: { box: "bg-purple-100/70", icon: "text-purple-600", bar: "bg-purple-500" },
  orange: { box: "bg-orange-100/70", icon: "text-orange-600", bar: "bg-orange-500" },
};

const badgeTone: Record<string, string> = {
  positive: "text-green-700 bg-green-50",
  negative: "text-red-700 bg-red-50",
  neutral: "text-gray-500 bg-gray-50",
};

function InfoCard({
  icon: Icon, label, value, sub, color, badge, badgeTone: tone,
}: {
  icon: any; label: string; value: string; sub?: string; color: string; badge?: string; badgeTone?: string;
}) {
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-1">
        <div className={`w-11 h-11 rounded-full ${c.box} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {badge && (
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${badgeTone[tone || "neutral"]}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-ib-muted mt-3">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
          {sub && <p className="text-xs text-ib-muted mt-1">{sub}</p>}
        </div>
        <div className={`w-1.5 h-10 rounded-full ${c.bar} opacity-80`} />
      </div>
    </div>
  );
}
