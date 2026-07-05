"use client";

import { useState, useEffect } from "react";
import { TrendingUp, ShoppingCart, Users, Package, Lightbulb } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DashboardData {
  totalRevenue: number;
  totalSales: number;
  totalCustomers: number;
  totalProducts: number;
}

const insights = [
  "O produto mais vendido do período é da categoria Alimentação, representando 38% do total de vendas.",
  "Tendência de crescimento de 12% em relação ao mês anterior, impulsionada por novos clientes.",
  "O ticket médio das vendas aumentou 8%, indicando maior valor agregado por transacção.",
  "Clientes recorrentes representam 64% das vendas, mostrando boa retenção.",
  "O horário de maior movimento é entre as 10h e as 12h, com pico às quartas-feiras.",
];

export default function AnaliseVendasPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((err) => console.error("Erro ao carregar análise de vendas:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-12 text-center text-ib-muted">A carregar...</div>;

  const stats = [
    { label: "Receita Total", value: data ? formatCurrency(data.totalRevenue) : "—", icon: TrendingUp, color: "bg-green-50 text-green-600" },
    { label: "Total Vendas", value: data?.totalSales || 0, icon: ShoppingCart, color: "bg-blue-50 text-blue-600" },
    { label: "Clientes", value: data?.totalCustomers || 0, icon: Users, color: "bg-purple-50 text-purple-600" },
    { label: "Produtos", value: data?.totalProducts || 0, icon: Package, color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ib-primary">Análise de Vendas</h1>
        <p className="text-ib-muted text-sm">Análise inteligente com insights automáticos</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-ib-primary">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h2 className="font-semibold text-ib-primary">Insights de Vendas</h2>
        </div>
        <ul className="space-y-3">
          {insights.map((insight, i) => (
            <li key={i} className="flex gap-3 text-sm text-ib-primary">
              <span className="w-5 h-5 rounded-full bg-ib-accent/10 text-ib-accent text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              {insight}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
