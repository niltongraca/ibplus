"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles, ArrowLeft, MessageCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_LIST, type Plan } from "@/config/plans";
import { apiFetch } from "@/lib/api";

function ctaLabel(plan: Plan): string {
  if (plan.id === "FREE") return "Plano Base";
  return `Seleccionar ${plan.name}`;
}

export default function UpgradePage() {
  const { user, refresh } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState("");
  const currentPlan = user?.companyPlan ?? user?.plan;

  // Garante que o plano mostrado é o mais recente (ex.: approve enquanto a página esteve aberta).
  useEffect(() => {
    void refresh();

    fetch("/api/upgrade/checkout")
      .then((res) => (res.ok ? res.json() : { enabled: false }))
      .then((data: { enabled?: boolean }) => setStripeEnabled(Boolean(data.enabled)))
      .catch(() => setStripeEnabled(false));

    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      setCheckoutNotice("Pagamento recebido. O seu plano será activado de imediato.");
    } else if (params.get("checkout") === "cancelled") {
      setCheckoutNotice("Pagamento cancelado. Pode tentar novamente ou pedir aprovação.");
    }
  }, [refresh]);

  function handleSelectPlan(plan: Plan) {
    if (plan.id === "FREE" || plan.id === currentPlan) return;
    setPhone("");
    setNote("");
    setError("");
    setSent(false);
    setSelectedPlan(plan);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan) return;

    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/api/upgrade/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toPlan: selectedPlan.id,
          phone: phone || null,
          note: note || null,
        }),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePay() {
    if (!selectedPlan) return;
    setSubmitting(true);
    setError("");
    try {
      const { url } = await apiFetch<{ url: string | null }>("/api/upgrade/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toPlan: selectedPlan.id,
          phone: phone || null,
          note: note || null,
        }),
      });
      if (!url) throw new Error("Não foi possível iniciar o pagamento.");
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar o pagamento.");
    } finally {
      setSubmitting(false);
    }
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

        {checkoutNotice && (
          <p role="status" className="mb-6 rounded-lg bg-blue-50 px-4 py-3 text-center text-sm text-blue-800">
            {checkoutNotice}
          </p>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {PLAN_LIST.map((plan) => {
            const isCurrent = plan.id === currentPlan;
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
            <div className="card p-6 w-full max-w-md mx-4">
              {sent ? (
                <div className="text-center">
                  <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Pedido enviado</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Recebemos o seu pedido de upgrade para <strong>{selectedPlan.name}</strong>.
                    A nossa equipa entrará em contacto para concluir a activação.
                  </p>
                  <button onClick={() => setSelectedPlan(null)} className="btn btn-primary w-full">
                    Fechar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <MessageCircle className="w-10 h-10 text-blue-600 mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Upgrade para {selectedPlan.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-5">
                    Pague com cartão para activação imediata ou envie o pedido para a nossa equipa analisar.
                  </p>

                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="upgrade-phone">
                    Telefone de contacto <span className="text-ib-muted">(opcional)</span>
                  </label>
                  <input
                    id="upgrade-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={50}
                    placeholder="9xx xxx xxx"
                    className="w-full mb-4 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
                  />

                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="upgrade-note">
                    Nota <span className="text-ib-muted">(opcional)</span>
                  </label>
                  <textarea
                    id="upgrade-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="Algo que devamos saber?"
                    className="w-full mb-4 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
                  />

                  {error && (
                    <p role="alert" className="text-sm text-red-600 mb-4">{error}</p>
                  )}

                  {stripeEnabled && (
                    <button
                      type="button"
                      onClick={handlePay}
                      disabled={submitting}
                      className="btn btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Pagar com cartão
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className={stripeEnabled ? "btn btn-outline w-full mt-2" : "btn btn-primary w-full flex items-center justify-center gap-2"}
                  >
                    {!stripeEnabled && submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {stripeEnabled ? "Pedir aprovação" : submitting ? "A enviar..." : "Enviar pedido"}
                  </button>
                  <div className="flex flex-col gap-2 mt-2">
                    <a
                      href={`mailto:suporte@ibplus.co.ao?subject=${encodeURIComponent(`Upgrade de Plano - ${selectedPlan.name}`)}`}
                      className="btn btn-outline w-full text-sm"
                    >
                      Prefiro falar por email
                    </a>
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(null)}
                      className="text-sm text-ib-muted hover:text-gray-900 py-2"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
