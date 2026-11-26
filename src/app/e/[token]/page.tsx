"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Ticket,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { EVENT_CATEGORY_LABELS } from "@/config/events";
import { SmartImage } from "@/components/SmartImage";

// Mesmo alfabeto do servidor (sem 0/O e 1/I) — a referência é gerada no browser
// para que o participante a possa usar na transferência antes de submeter.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generatePaymentReference(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) out += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return `INS-${out.slice(0, 5)}-${out.slice(5)}`;
}

/**
 * A referência é gerada no cliente e preservada entre renders sem gravar estado
 * dentro de um efeito (o servidor devolve apenas a snapshot vazia).
 */
function createReferenceStore() {
  let current = "";
  const listeners = new Set<() => void>();
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      if (!current) current = generatePaymentReference();
      return current;
    },
    regenerate() {
      current = generatePaymentReference();
      for (const listener of listeners) listener();
    },
  };
}

const getServerReference = () => "";
const referenceStore = createReferenceStore();

function whatsappHref(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

interface PublicEventData {
  event: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    venue: string | null;
    address: string | null;
    province: string | null;
    municipality: string | null;
    startDate: string;
    endDate: string | null;
    coverImage: string | null;
    organizerName: string;
  };
  ticketTypes: Array<{
    id: string;
    name: string;
    kind: string;
    description: string | null;
    price: number;
    unlimited: boolean;
    remaining: number | null;
  }>;
  payment: {
    bankName: string;
    accountName: string;
    iban: string;
    multicaixaEntity: string;
    supportPhone: string;
    configured: boolean;
  };
  contact: { email: string; phone: string | null };
}

interface RegistrationResult {
  registration: {
    id: string;
    code: string;
    reference: string;
    amount: number;
    status: string;
    createdAt: string;
  };
}

function CopyButton({ value, label }: { value: string; label: string }) {
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
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1 text-xs font-medium text-ib-accent hover:underline shrink-0"
      aria-label={`Copiar ${label}`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

export default function PublicEventPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<PublicEventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reference = useSyncExternalStore(
    referenceStore.subscribe,
    referenceStore.getSnapshot,
    getServerReference
  );

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [holderName, setHolderName] = useState("");
  const [holderEmail, setHolderEmail] = useState("");
  const [holderPhone, setHolderPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState<RegistrationResult["registration"] | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    params.then((p) => setToken(p.token)).catch(() => setError("Link inválido."));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    (async () => {
      try {
        const res = await apiFetch<PublicEventData>(`/api/public/events/${token}`);
        if (active) setData(res);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Não foi possível carregar o evento.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  const selected = useMemo(
    () =>
      (data?.ticketTypes ?? []).flatMap((type) => {
        const qty = quantities[type.id] ?? 0;
        return qty > 0 ? [{ type, quantity: qty }] : [];
      }),
    [data, quantities]
  );
  const total = selected.reduce((sum, item) => sum + item.type.price * item.quantity, 0);
  const totalTickets = selected.reduce((sum, item) => sum + item.quantity, 0);

  function changeQuantity(typeId: string, delta: number, remaining: number | null) {
    setQuantities((prev) => {
      const current = prev[typeId] ?? 0;
      const next = Math.max(0, current + delta);
      if (remaining !== null && next > remaining) return prev;
      if (next > 50) return prev;
      return { ...prev, [typeId]: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!selected.length) return setFormError("Selecione pelo menos um bilhete.");
    if (!holderName.trim()) return setFormError("Indique o seu nome completo.");
    if (!holderEmail.trim()) return setFormError("Indique o seu email.");
    if (!holderPhone.trim()) return setFormError("Indique o seu telefone.");
    if (!proof) return setFormError("Anexe o comprovativo de pagamento.");
    if (!consent) return setFormError("É necessário autorizar o tratamento dos dados.");
    if (!reference) return setFormError("A referência de pagamento ainda não está disponível.");

    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("reference", reference);
      form.set("holderName", holderName.trim());
      form.set("holderEmail", holderEmail.trim());
      form.set("holderPhone", holderPhone.trim());
      form.set("notes", notes.trim());
      form.set("consent", "true");
      form.set("items", JSON.stringify(selected.map((s) => ({ ticketTypeId: s.type.id, quantity: s.quantity }))));
      form.set("proof", proof);

      const res = await apiFetch<RegistrationResult>(
        `/api/public/events/${token}/registrations`,
        { method: "POST", body: form }
      );
      setSuccess(res.registration);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Não foi possível submeter a inscrição."
      );
      // O stock pode ter mudado: actualiza a disponibilidade sem perder o formulário.
      if (token) {
        apiFetch<PublicEventData>(`/api/public/events/${token}`)
          .then(setData)
          .catch(() => undefined);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <Loader2 className="w-7 h-7 animate-spin text-ib-accent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div className="card card-pad max-w-md w-full text-center space-y-3">
          <Ticket className="w-9 h-9 mx-auto" style={{ color: "var(--text-muted)" }} />
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Link indisponível
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {error || "Este link não está disponível."}
          </p>
          <Link href="/" className="btn btn-outline btn-sm inline-flex">
            <ArrowLeft className="w-4 h-4" /> Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  const { event, ticketTypes, payment, contact } = data;
  const waLink = whatsappHref(payment.supportPhone || contact.phone);

  if (success) {
    return (
      <div className="min-h-screen px-4 py-10" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div className="max-w-xl mx-auto card card-pad text-center space-y-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: "rgba(34, 197, 94, 0.12)" }}
          >
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Inscrição submetida!
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Recebemos o seu comprovativo para <strong>{event.title}</strong>. A inscrição fica
            pendente até o organizador validar o pagamento — enviaremos um email quando for
            aprovada.
          </p>
          <div className="rounded-xl border p-4 text-left space-y-2" style={{ borderColor: "var(--border-color)" }}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Código</span>
              <span className="font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{success.code}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Referência</span>
              <span className="font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{success.reference}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Total</span>
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{formatCurrency(success.amount)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Estado</span>
              <span className="badge badge-warning">Pendente</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSuccess(null);
              setQuantities({});
              setProof(null);
              setNotes("");
              setConsent(false);
              if (fileInput.current) fileInput.current.value = "";
              referenceStore.regenerate();
            }}
            className="btn btn-outline btn-sm"
          >
            Fazer outra inscrição
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ backgroundColor: "var(--bg-secondary)" }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-ib-accent">
            Inscrição online
          </p>
          <h1 className="text-3xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" /> {formatDateTime(event.startDate)}
            </span>
            {(event.venue || event.municipality) && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {[event.venue, event.municipality, event.province].filter(Boolean).join(", ")}
              </span>
            )}
            <span>Organizado por {event.organizerName}</span>
          </div>
        </div>

        {event.coverImage && (
          <div className="relative w-full h-56 rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--skeleton)" }}>
            <SmartImage src={event.coverImage} alt={event.title} fill sizes="(max-width: 1024px) 100vw, 1024px" className="object-cover" />
          </div>
        )}

        {event.description && (
          <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
            {event.description}
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
            <section className="card card-pad space-y-4">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-ib-accent" />
                <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Escolha os bilhetes</h2>
              </div>

              {ticketTypes.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Este evento ainda não tem tipos de bilhete disponíveis.
                </p>
              ) : (
                <div className="space-y-3">
                  {ticketTypes.map((type) => {
                    const qty = quantities[type.id] ?? 0;
                    const soldOut = type.remaining === 0;
                    return (
                      <div
                        key={type.id}
                        className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3"
                        style={{ borderColor: "var(--border-color)", opacity: soldOut ? 0.6 : 1 }}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                            {type.name}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {formatCurrency(type.price)}
                            {type.description ? ` · ${type.description}` : ""}
                            {type.remaining !== null && !type.unlimited
                              ? ` · ${type.remaining} disponível(eis)`
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => changeQuantity(type.id, -1, type.remaining)}
                            disabled={qty === 0 || soldOut}
                            className="btn-icon btn-ghost"
                            aria-label={`Retirar um bilhete de ${type.name}`}
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(type.id, 1, type.remaining)}
                            disabled={soldOut || (type.remaining !== null && qty >= type.remaining) || qty >= 50}
                            className="btn-icon btn-ghost"
                            aria-label={`Adicionar um bilhete de ${type.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="card card-pad space-y-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Dados do participante</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="reg-name">Nome completo *</label>
                  <input
                    id="reg-name"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    className="input"
                    autoComplete="name"
                    maxLength={200}
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="reg-email">Email *</label>
                  <input
                    id="reg-email"
                    type="email"
                    value={holderEmail}
                    onChange={(e) => setHolderEmail(e.target.value)}
                    className="input"
                    autoComplete="email"
                    maxLength={255}
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="reg-phone">Telefone *</label>
                  <input
                    id="reg-phone"
                    type="tel"
                    value={holderPhone}
                    onChange={(e) => setHolderPhone(e.target.value)}
                    className="input"
                    autoComplete="tel"
                    maxLength={50}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="reg-notes">Notas (opcional)</label>
                <textarea
                  id="reg-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input min-h-[80px]"
                  maxLength={2000}
                  placeholder="Ex.: nome para o cartão de convite, necessidades especiais..."
                />
              </div>
            </section>

            <section className="card card-pad space-y-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Comprovativo de pagamento</h2>
              <div>
                <label className="label" htmlFor="reg-proof">Ficheiro *</label>
                <input
                  id="reg-proof"
                  ref={fileInput}
                  type="file"
                  accept=".png,.jpg,.jpeg,.gif,.webp,.pdf"
                  onChange={(e) => setProof(e.target.files?.[0] ?? null)}
                  className="input"
                  required
                />
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Imagem ou PDF do comprovativo, até 5 MB.
                </p>
              </div>
              <label className="flex items-start gap-2 text-sm cursor-pointer" style={{ color: "var(--text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5"
                  required
                />
                <span>
                  Autorizo o tratamento dos meus dados para a gestão desta inscrição e confirmo
                  que os dados são verdadeiros. *
                </span>
              </label>

              {formError && (
                <div
                  role="alert"
                  className="rounded-xl border px-4 py-3 text-sm"
                  style={{ borderColor: "rgba(239, 68, 68, 0.3)", backgroundColor: "rgba(239, 68, 68, 0.08)", color: "var(--color-ib-danger)" }}
                >
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !ticketTypes.length}
                className="btn btn-primary w-full justify-center"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {submitting ? "A submeter..." : `Submeter inscrição · ${formatCurrency(total)}`}
              </button>
              <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                A sua inscrição fica pendente até o organizador validar o comprovativo.
              </p>
            </section>
          </form>

          <aside className="lg:col-span-2 space-y-5">
            <section className="card card-pad space-y-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Como pagar</h2>

              <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--skeleton)" }}>
                <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  Referência de pagamento
                </p>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="font-mono text-lg font-bold tracking-wide break-all" style={{ color: "var(--text-primary)" }}>
                    {reference || "..."}
                  </span>
                  {reference && <CopyButton value={reference} label="referência" />}
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  Indique esta referência na transferência ou depósito.
                </p>
              </div>

              {payment.configured ? (
                <div className="space-y-3 text-sm">
                  {payment.bankName && (
                    <div>
                      <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Banco</p>
                      <p style={{ color: "var(--text-primary)" }}>{payment.bankName}</p>
                    </div>
                  )}
                  {payment.accountName && (
                    <div>
                      <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Titular</p>
                      <p style={{ color: "var(--text-primary)" }}>{payment.accountName}</p>
                    </div>
                  )}
                  {payment.iban && (
                    <div>
                      <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>IBAN</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono break-all" style={{ color: "var(--text-primary)" }}>{payment.iban}</span>
                        <CopyButton value={payment.iban} label="IBAN" />
                      </div>
                    </div>
                  )}
                  {payment.multicaixaEntity && (
                    <div>
                      <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Entidade Multicaixa</p>
                      <span className="font-mono" style={{ color: "var(--text-primary)" }}>{payment.multicaixaEntity}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "var(--border-color)" }}>
                  <p style={{ color: "var(--text-secondary)" }}>
                    Os dados de pagamento não estão configurados. Contacte o organizador para
                    saber como efectuar a transferência antes de anexar o comprovativo.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t space-y-2 text-sm" style={{ borderColor: "var(--border-color)" }}>
                <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Contacto do organizador</p>
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:underline" style={{ color: "var(--text-primary)" }}>
                    <Mail className="w-4 h-4 text-ib-accent" /> {contact.email}
                  </a>
                )}
                {waLink && (
                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline" style={{ color: "var(--text-primary)" }}>
                    <MessageCircle className="w-4 h-4 text-ib-accent" /> WhatsApp
                  </a>
                )}
              </div>
            </section>

            <section className="card card-pad space-y-3">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Resumo</h2>
              {selected.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Ainda não selecionou bilhetes.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {selected.map((s) => (
                    <div key={s.type.id} className="flex justify-between gap-3" style={{ color: "var(--text-secondary)" }}>
                      <span>{s.quantity} × {s.type.name}</span>
                      <span>{formatCurrency(s.type.price * s.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: "var(--border-color)" }}>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Total ({totalTickets} bilhete(s))</span>
                <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{formatCurrency(total)}</span>
              </div>
              {event.category && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Categoria: {EVENT_CATEGORY_LABELS[event.category as keyof typeof EVENT_CATEGORY_LABELS] ?? event.category}
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
