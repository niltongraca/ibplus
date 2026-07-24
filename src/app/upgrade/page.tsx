"use client";

import { useState } from "react";
import { Check, Sparkles, ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const plans = [
  {
    name: "Grátis",
    price: "0 Kz",
    period: "/mês",
    planKey: "FREE",
    features: ["1 utilizador", "Até 50 clientes", "Até 20 produtos", "Gestão de vendas", "Dashboard básico"],
    cta: "Plano Actual",
    ctaStyle: "bg-gray-100 text-gray-500 cursor-default",
  },
  {
    name: "Premium",
    price: "12.500 Kz",
    period: "/mês",
    planKey: "PREMIUM",
    features: [
      "Até 5 utilizadores", "Clientes ilimitados", "Produtos ilimitados",
      "Gestão de stock", "Relatórios financeiros", "IA e recomendações",
    ],
    cta: "Seleccionar Premium",
    ctaStyle: "bg-blue-600 text-white hover:bg-blue-700",
    popular: true,
  },
  {
    name: "Business",
    price: "25.000 Kz",
    period: "/mês",
    planKey: "BUSINESS",
    features: [
      "Utilizadores ilimitados", "Tudo do Premium", "CRM completo",
      "API e integrações", "Suporte prioritário", "Loja online",
    ],
    cta: "Seleccionar Business",
    ctaStyle: "bg-gray-900 text-white hover:bg-gray-800",
  },
];

export default function UpgradePage() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  function handleSelectPlan(planKey: string) {
    if (planKey === "FREE" || planKey === user?.plan) return;
    setSelectedPlan(planKey);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link href="/gestao/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" /> Voltar ao painel
        </Link>

        <div className="text-center mb-12">
          <Sparkles className="w-10 h-10 text-blue-600 mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-gray-900">Escolha o seu Plano</h1>
          <p className="text-gray-500 mt-2">Comece grátis e faça upgrade conforme o seu negócio cresce</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.planKey === user?.plan;
            return (
              <div key={plan.name} className={`bg-white rounded-2xl border ${plan.popular ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-200"} p-6 shadow-sm relative`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Mais Popular
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 right-4 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                    Actual
                  </span>
                )}
                <h2 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h2>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSelectPlan(plan.planKey)}
                  disabled={isCurrent}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${isCurrent ? "bg-gray-100 text-gray-400 cursor-default" : plan.ctaStyle}`}
                >
                  {isCurrent ? "Plano Actual" : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {selectedPlan && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 text-center">
              <MessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Upgrade para {selectedPlan}</h3>
              <p className="text-gray-500 text-sm mb-6">
                Para fazer upgrade do seu plano, entre em contacto connosco. A nossa equipa irá assisti-lo com a activação do novo plano.
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="mailto:suporte@ibplus.co.ao?subject=Upgrade de Plano"
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Enviar Email para Suporte
                </a>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="w-full py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
