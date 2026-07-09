"use client";

import { Check, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Grátis",
    price: "0 Kz",
    period: "/mês",
    features: ["1 utilizador", "Até 50 clientes", "Até 20 produtos", "Gestão de vendas", "Dashboard básico"],
    cta: "Plano Actual",
    ctaStyle: "bg-gray-100 text-ib-primary cursor-default",
  },
  {
    name: "Premium",
    price: "12.500 Kz",
    period: "/mês",
    features: [
      "Até 5 utilizadores", "Clientes ilimitados", "Produtos ilimitados",
      "Gestão de stock", "Relatórios financeiros", "IA e recomendações",
    ],
    cta: "Seleccionar Premium",
    ctaStyle: "bg-ib-accent text-white hover:bg-blue-700",
    popular: true,
  },
  {
    name: "Business",
    price: "25.000 Kz",
    period: "/mês",
    features: [
      "Utilizadores ilimitados", "Tudo do Premium", "CRM completo",
      "API e integrações", "Suporte prioritário", "Loja online",
    ],
    cta: "Seleccionar Business",
    ctaStyle: "bg-ib-primary text-white hover:bg-gray-800",
  },
];

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link href="/gestao/dashboard" className="inline-flex items-center gap-2 text-ib-muted hover:text-ib-primary mb-8">
          <ArrowLeft className="w-4 h-4" /> Voltar ao painel
        </Link>

        <div className="text-center mb-12">
          <Sparkles className="w-10 h-10 text-ib-accent mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-ib-primary">Escolha o seu Plano</h1>
          <p className="text-ib-muted mt-2">Comece grátis e faça upgrade conforme o seu negócio cresce</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-white rounded-2xl border ${plan.popular ? "border-ib-accent ring-2 ring-ib-accent/20" : "border-gray-200"} p-6 shadow-sm relative`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ib-accent text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Mais Popular
                </span>
              )}
              <h2 className="text-xl font-bold text-ib-primary mb-1">{plan.name}</h2>
              <div className="mb-6">
                <span className="text-3xl font-bold text-ib-primary">{plan.price}</span>
                <span className="text-ib-muted text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ib-primary">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${plan.ctaStyle}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
