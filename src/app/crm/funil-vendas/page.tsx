"use client";

import { TrendingUp } from "lucide-react";

const stages = [
  {
    name: "Lead",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    cards: [
      { title: "João Silva", subtitle: "Potencial cliente", value: "15.000 Kz" },
      { title: "Ana Santos", subtitle: "Indicação", value: "8.500 Kz" },
    ],
  },
  {
    name: "Qualificado",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    cards: [
      { title: "Maria Fernandes", subtitle: "Demonstração agendada", value: "45.000 Kz" },
    ],
  },
  {
    name: "Proposta",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    cards: [
      { title: "Carlos Pereira", subtitle: "Proposta enviada", value: "120.000 Kz" },
      { title: "Lúcia Costa", subtitle: "A aguardar resposta", value: "67.000 Kz" },
    ],
  },
  {
    name: "Negociação",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    cards: [
      { title: "Pedro Almeida", subtitle: "Última reunião", value: "230.000 Kz" },
    ],
  },
  {
    name: "Fechado",
    color: "bg-green-100 text-green-700 border-green-200",
    cards: [
      { title: "Empresa Lda", subtitle: "Contrato assinado", value: "350.000 Kz" },
      { title: "Rita Martins", subtitle: "Fidelizado", value: "95.000 Kz" },
    ],
  },
];

export default function FunilVendasPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Funil de Vendas</h1>
          <p className="text-ib-muted text-sm">Acompanhe as oportunidades do negócio</p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
        {stages.map((stage) => (
          <div key={stage.name} className="flex-shrink-0 w-72 snap-start">
            <div className={`rounded-xl border px-4 py-2.5 mb-3 ${stage.color}`}>
              <p className="text-sm font-semibold">{stage.name}</p>
              <p className="text-xs opacity-75">{stage.cards.length} oportunidade{stage.cards.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="space-y-3">
              {stage.cards.map((card) => (
                <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <p className="font-medium text-ib-primary text-sm">{card.title}</p>
                  <p className="text-xs text-ib-muted mt-0.5">{card.subtitle}</p>
                  <p className="text-sm font-semibold text-ib-accent mt-3">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-ib-accent" />
          <h3 className="font-semibold text-ib-primary">Resumo do Funil</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {stages.map((stage) => (
            <div key={stage.name} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-ib-muted mb-1">{stage.name}</p>
              <p className="text-lg font-bold text-ib-primary">
                {stage.cards.reduce((sum, c) => sum + parseInt(c.value.replace(/\D/g, "")), 0).toLocaleString()} Kz
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
