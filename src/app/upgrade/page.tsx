"use client";

import { useState } from "react";
import { Check, Sparkles, ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_LIST, type Plan } from "@/config/plans";

function ctaLabel(plan: Plan): string {
  if (plan.id === "FREE") return "Plano Base";
  return `Seleccionar ${plan.name}`;
}

export default function UpgradePage() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  function handleSelectPlan(plan: Plan) {
    if (plan.id === "FREE" || plan.id === user?.plan) return;
    setSelectedPlan(plan.name);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link href="/gestao/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" /> Voltar ao painel
        </Link>

        <div className="text-center mb-12">
          <Sparkles className="w-10 h-10 text-blue-600 mx-auto mb-3" />
          <h1 className="page-title text-3xl">Escolha o seu Plano</h1>
          <p className="text-ib-muted mt-2">Comece grátis e faça upgrade conforme o seu negócio cresce</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLAN_LIST.map((plan) => {
            const isCurrent = plan.id === user?.plan;
            const isFree = plan.id === "FREE";
            return (
              <div key={plan.id} className={`card p-6 shadow-sm relative ${plan.highlighted ? "border-blue-500 ring-2 ring-blue-500/20" : ""}`}>
                {plan.highlighted && (
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
                <p className="text-sm text-ib-muted mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">{plan.priceLabel}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.filter((f) => f.included).map((f) => (
                    <li key={f.text} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {f.text}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrent || isFree}
                  className={`btn w-full ${isCurrent || isFree ? "bg-gray-100 text-gray-400 cursor-default" : plan.highlighted ? "btn btn-primary" : "bg-gray-900 text-white hover:bg-gray-800"}`}
                >
                  {isCurrent ? "Plano Actual" : ctaLabel(plan)}
                </button>
              </div>
            );
          })}
        </div>

        {selectedPlan && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="card p-6 w-full max-w-md mx-4 text-center">
              <MessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Upgrade para {selectedPlan}</h3>
              <p className="text-gray-500 text-sm mb-6">
                Para fazer upgrade do seu plano, entre em contacto connosco. A nossa equipa irá assisti-lo com a activação do novo plano.
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="mailto:suporte@ibplus.co.ao?subject=Upgrade de Plano"
                  className="btn btn-primary w-full"
                >
                  Enviar Email para Suporte
                </a>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="btn btn-outline w-full"
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
