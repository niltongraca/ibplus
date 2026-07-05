"use client";

import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const forecasts = [
  {
    title: "Previsão de Vendas",
    icon: TrendingUp,
    color: "text-green-600",
    bg: "bg-green-50",
    chartColors: "from-green-200 to-green-500",
    prediction: "+15.4%",
    value: formatCurrency(4850000),
    description: "Receita estimada para o próximo mês com base na tendência actual.",
  },
  {
    title: "Previsão de Despesas",
    icon: TrendingDown,
    color: "text-red-600",
    bg: "bg-red-50",
    chartColors: "from-red-200 to-red-500",
    prediction: "+5.2%",
    value: formatCurrency(2100000),
    description: "Aumento estimado de despesas operacionais para o próximo período.",
  },
  {
    title: "Crescimento Estimado",
    icon: BarChart3,
    color: "text-blue-600",
    bg: "bg-blue-50",
    chartColors: "from-blue-200 to-blue-500",
    prediction: "+10.2%",
    value: "2.8x",
    description: "Taxa de crescimento anual composta projetada com base nos últimos 12 meses.",
  },
];

export default function PrevisoesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ib-primary">Previsões</h1>
        <p className="text-ib-muted text-sm">Previsões inteligentes de vendas e tendências do negócio</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {forecasts.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">{f.title}</span>
                </div>

                <div className="h-24 rounded-lg mb-4 bg-gradient-to-r ${f.chartColors} opacity-30 relative overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
                    <path d="M0,60 C30,55 40,20 70,30 C100,40 120,10 150,20 C170,25 190,10 200,15 L200,80 L0,80 Z" fill="currentColor" className="text-white/40" />
                    <path d="M0,60 C30,55 40,20 70,30 C100,40 120,10 150,20 C170,25 190,10 200,15" fill="none" stroke="currentColor" strokeWidth="2" className="text-white" />
                  </svg>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`text-lg font-bold ${f.color}`}>{f.prediction}</span>
                  <span className="text-2xl font-bold text-ib-primary">{f.value}</span>
                </div>
                <p className="text-xs text-ib-muted">{f.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
