"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Check,
  Clock,
  Copy,
  MessageCircle,
  Sparkles,
  Upload,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_LIST, type Plan } from "@/config/plans";
import { getManualPaymentDetails } from "@/config/payments";
import { apiFetch } from "@/lib/api";

interface PendingRequest {
  id: string;
  toPlan: string;
  paymentStatus: string;
  paymentRef: string | null;
  hasProof: boolean;
  createdAt?: string;
}

function ctaLabel(plan: Plan): string {
  if (plan.id === "FREE") return "Plano Base";
  return `Seleccionar ${plan.name}`;
}

function formatAmount(plan: Plan): string {
  return `${plan.price.toLocaleString("pt-AO")} Kz`;
}

function whatsappHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponível: o valor continua visível para copiar à mão.
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-ib-muted">{label}</p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-900 break-all">{value}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 shrink-0"
          aria-label={`Copiar ${label}`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  const { user, refresh } = useAuth();
  const details = useMemo(() => getManualPaymentDetails(), []);

  const [pending, setPending] = useState<PendingRequest | null>(null);
  const [modalPlan, setModalPlan] = useState<Plan | null>(null);
  const [modalRequest, setModalRequest] = useState<PendingRequest | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState(false);

  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [bankRef, setBankRef] = useState("");
  const [savingProof, setSavingProof] = useState(false);
  const [proofSaved, setProofSaved] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const currentPlan = user?.companyPlan ?? user?.plan;
  const pendingPlan = pending ? PLAN_LIST.find((p) => p.id === pending.toPlan) ?? null : null;
  const supportLink = whatsappHref(details.supportPhone);

  // Plano actualizado + pedido pendente (para retomar as instruções ao recarregar).
  useEffect(() => {
    void refresh();
    fetch("/api/upgrade/request")
      .then((res) => (res.ok ? res.json() : { request: null }))
      .then((data: { request?: PendingRequest | null }) => setPending(data.request ?? null))
      .catch(() => setPending(null));

    fetch("/api/upgrade/checkout")
      .then((res) => (res.ok ? res.json() : { enabled: false }))
      .then((data: { enabled?: boolean }) => setStripeEnabled(Boolean(data.enabled)))
      .catch(() => setStripeEnabled(false));
  }, [refresh]);

  function resetProofState() {
    setFile(null);
    setBankRef("");
    setProofSaved(false);
    setError("");
    if (fileInput.current) fileInput.current.value = "";
  }

  function handleSelectPlan(plan: Plan) {
    if (plan.id === "FREE" || plan.id === currentPlan) return;
    setError("");
    setPhone("");
    setNote("");
    resetProofState();
    setModalPlan(plan);
    setModalRequest(pending?.toPlan === plan.id ? pending : null);
  }

  function closeModal() {
    setModalPlan(null);
    setModalRequest(null);
    setError("");
    setSubmitting(false);
    resetProofState();
  }

  function openPending() {
    if (!pending) return;
    const plan = PLAN_LIST.find((p) => p.id === pending.toPlan);
    if (!plan) return;
    setError("");
    resetProofState();
    setModalRequest(pending);
    setModalPlan(plan);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!modalPlan) return;

    setSubmitting(true);
    setError("");
    try {
      const { request } = await apiFetch<{ request: PendingRequest }>("/api/upgrade/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toPlan: modalPlan.id,
          phone: phone || null,
          note: note || null,
        }),
      });
      setPending(request);
      setModalRequest(request);
    } catch (err) {
      // Pedido já existente: retoma as instruções em vez de mostrar um beco sem saída.
      if ((err as { code?: string })?.code === "UPGRADE_REQUEST_PENDING") {
        try {
          const data = await fetch("/api/upgrade/request").then((res) => res.json());
          if (data?.request) {
            setPending(data.request);
            setModalRequest(data.request);
            return;
          }
        } catch {
          // cai no erro genérico
        }
      }
      setError(err instanceof Error ? err.message : "Não foi possível enviar o pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePay() {
    if (!modalPlan) return;
    setSubmitting(true);
    setError("");
    try {
      const { url } = await apiFetch<{ url: string | null }>("/api/upgrade/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toPlan: modalPlan.id,
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

  async function handleProof(e: React.FormEvent) {
    e.preventDefault();
    if (!modalRequest) return;

    if (!file && !bankRef.trim()) {
      setError("Anexe o comprovativo ou indique a referência da transferência.");
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setError("O ficheiro é demasiado grande (máx. 5MB).");
      return;
    }

    setSavingProof(true);
    setError("");
    try {
      let proofUrl: string | undefined;
      if (file) {
        const body = new FormData();
        body.append("file", file);
        const uploaded = await apiFetch<{ url: string }>("/api/upload", { method: "POST", body });
        proofUrl = uploaded.url;
      }

      const { request: updated } = await apiFetch<{ request: PendingRequest }>(
        `/api/upgrade/request/${modalRequest.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentRef: bankRef.trim() || null, proofUrl: proofUrl ?? null }),
        }
      );

      setModalRequest({ ...modalRequest, ...updated });
      setPending((prev) => (prev ? { ...prev, ...updated } : prev));
      setProofSaved(true);
      setFile(null);
      setBankRef("");
      if (fileInput.current) fileInput.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o comprovativo.");
    } finally {
      setSavingProof(false);
    }
  }

  const hasPaymentDetails = Boolean(details.iban || details.multicaixaEntity);

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

        {pending && pendingPlan && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-2 text-sm text-amber-800">
              <Clock className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Pedido pendente para <strong>{pendingPlan.name}</strong>
                {pending.paymentStatus === "PENDING"
                  ? " — comprovativo em análise."
                  : " — falta efectuar o pagamento."}
              </span>
            </div>
            <button type="button" onClick={openPending} className="btn btn-outline text-sm py-1.5">
              Ver instruções
            </button>
          </div>
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

        {modalPlan && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {modalRequest ? (
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <Building2 className="w-9 h-9 text-blue-600 shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Pagamento do plano {modalPlan.name}
                      </h3>
                      <p className="text-sm text-ib-muted">
                        {modalPlan.description} · <strong>{formatAmount(modalPlan)}</strong>/mês
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <CopyField label="Referência do pedido" value={modalRequest.paymentRef ?? modalRequest.id} />
                    {details.iban && <CopyField label="IBAN" value={details.iban} />}
                    {details.accountName && (
                      <CopyField label="Titular da conta" value={details.accountName} />
                    )}
                    {details.multicaixaEntity && (
                      <CopyField label="Entidade Multicaixa" value={details.multicaixaEntity} />
                    )}
                    {!hasPaymentDetails && (
                      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Os dados bancários ainda não estão configurados. Contacte o suporte para receber
                        as instruções de pagamento.
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-ib-muted mb-5">
                    Efectue a transferência ou o pagamento por Multicaixa Express com a referência
                    <strong> {modalRequest.paymentRef ?? modalRequest.id}</strong> e anexe o comprovativo
                    abaixo. A activação é feita após confirmação da nossa equipa.
                  </p>

                  {proofSaved && (
                    <p role="status" className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                      Comprovativo enviado. O seu pedido está em análise.
                    </p>
                  )}

                  <form onSubmit={handleProof} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="upgrade-proof">
                        Comprovativo <span className="text-ib-muted">(imagem até 5MB)</span>
                      </label>
                      <input
                        id="upgrade-proof"
                        ref={fileInput}
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="upgrade-ref">
                        Referência da transferência <span className="text-ib-muted">(opcional)</span>
                      </label>
                      <input
                        id="upgrade-ref"
                        type="text"
                        value={bankRef}
                        onChange={(e) => setBankRef(e.target.value)}
                        maxLength={60}
                        placeholder="Nº do documento ou referência do banco"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
                      />
                    </div>

                    {error && (
                      <p role="alert" className="text-sm text-red-600">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={savingProof}
                      className="btn btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {savingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {savingProof ? "A enviar..." : modalRequest.hasProof ? "Actualizar comprovativo" : "Enviar comprovativo"}
                    </button>
                  </form>

                  <div className="mt-4 flex flex-col gap-2">
                    {supportLink && (
                      <a href={supportLink} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full text-sm">
                        Falar com o suporte
                      </a>
                    )}
                    <a
                      href={`mailto:suporte@ibplus.co.ao?subject=${encodeURIComponent(`Upgrade de Plano - ${modalPlan.name}`)}`}
                      className="btn btn-outline w-full text-sm"
                    >
                      Prefiro falar por email
                    </a>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="text-sm text-ib-muted hover:text-gray-900 py-2"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <MessageCircle className="w-10 h-10 text-blue-600 mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Upgrade para {modalPlan.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-5">
                    {stripeEnabled
                      ? `Pague com cartão para activação imediata ou escolha transferência/Multicaixa (${formatAmount(modalPlan)}/mês).`
                      : `Preencha os dados e receba as instruções de pagamento (${formatAmount(modalPlan)}/mês) por transferência ou Multicaixa.`}
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
                    className={stripeEnabled
                      ? "btn btn-outline w-full mt-2 flex items-center justify-center gap-2"
                      : "btn btn-primary w-full flex items-center justify-center gap-2"}
                  >
                    {!stripeEnabled && submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {stripeEnabled ? "Pagar por transferência" : submitting ? "A preparar..." : "Continuar para pagamento"}
                  </button>

                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="text-sm text-ib-muted hover:text-gray-900 py-2 w-full"
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
