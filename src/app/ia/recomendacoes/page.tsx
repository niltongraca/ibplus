"use client";

import { Sparkles, ShoppingCart, Users, TrendingUp, AlertTriangle, Package } from "lucide-react";

const recommendations = [
  {
    title: "Aumentar stock do produto",
    detail: "Arroz 25kg — O stock actual cobre apenas 5 dias. Considere encomendar 200 unidades.",
    icon: Package,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    title: "Melhorar follow-up com clientes",
    detail: "15 clientes não compram há mais de 60 dias. Active uma campanha de recuperação.",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Ajustar preços de bebidas",
    detail: "A margem média das bebidas está 8% abaixo da meta. Reveja os preços do fornecedor actual.",
    icon: TrendingUp,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Produtos com baixo giro",
    detail: "3 produtos da categoria Higiene não vendem há 90 dias. Considere promoção ou descontinuação.",
    icon: AlertTriangle,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  {
    title: "Oportunidade de venda cruzada",
    detail: "Clientes que compram Óleo alimentar também compram Massa com frequência. Crie pacotes promocionais.",
    icon: ShoppingCart,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    title: "Reduzir despesas operacionais",
    detail: "Os custos de logística aumentaram 12% este mês. Avalie rotas e transportadoras alternativas.",
    icon: TrendingUp,
    color: "text-red-600",
    bg: "bg-red-50",
  },
];

export default function RecomendacoesPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-ib-accent" />
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Recomendações</h1>
          <p className="text-ib-muted text-sm">Sugestões inteligentes para optimizar o seu negócio</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {recommendations.map((rec) => {
          const Icon = rec.icon;
          return (
            <div key={rec.title} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-lg ${rec.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${rec.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-ib-primary text-sm mb-1">{rec.title}</h3>
                  <p className="text-sm text-ib-muted">{rec.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
