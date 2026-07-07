"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Check, X, Crown, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { PLAN_LIST } from "@/config/plans";

const BADGE_COLORS: Record<string, string> = {
  FREE: "bg-gray-100 text-gray-800",
  PREMIUM: "bg-yellow-100 text-yellow-800",
  BUSINESS: "bg-blue-100 text-blue-800",
};

export default function UpgradePage() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleUpgrade = async (planId: string) => {
    setLoading(planId);
    setError("");
    try {
      const res = await fetch("/api/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao actualizar plano");
      }
      await refresh();
      router.push("/gestao/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="text-center mb-12">
          <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Escolha o seu plano</h1>
          <p className="text-gray-600 mt-2">
            {user ? `Plano actual: ` : ""}
            {user && (
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${BADGE_COLORS[user.plan ?? "FREE"]}`}>
                {user.plan === "FREE" ? "Grátis" : user.plan === "PREMIUM" ? "Premium" : "Business"}
              </span>
            )}
          </p>
        </div>

        {error && <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        <div className="grid md:grid-cols-3 gap-6">
          {PLAN_LIST.map((plan) => {
            const isCurrent = user?.plan === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-sm border-2 p-6 flex flex-col ${
                  plan.highlighted ? "border-yellow-400 shadow-lg scale-105" : "border-gray-200"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1 rounded-full">
                    MAIS POPULAR
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                  <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">{plan.priceLabel}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      {f.included ? (
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                      )}
                      <span className={f.included ? "text-gray-700" : "text-gray-400"}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || loading === plan.id}
                  className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
                    isCurrent
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : plan.highlighted
                      ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-500 shadow-md"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  } ${loading === plan.id ? "opacity-50 cursor-wait" : ""}`}
                >
                  {loading === plan.id ? "A processar..." : isCurrent ? "Plano actual" : "Seleccionar"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
