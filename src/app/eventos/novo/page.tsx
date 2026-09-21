"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Save, Ticket, Trash2 } from "lucide-react";
import { useToast } from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS } from "@/config/events";

interface TicketTypeForm {
  name: string;
  kind: "CONVITE" | "INGRESSO" | "BILHETE";
  price: string;
  quantity: string;
}

const EMPTY_TYPE: TicketTypeForm = { name: "", kind: "INGRESSO", price: "", quantity: "" };

export default function NovoEventoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    venue: "",
    address: "",
    province: "",
    municipality: "",
    startDate: "",
    endDate: "",
    localPurchaseValue: "",
    totalTickets: "",
    status: "RASCUNHO",
    published: false,
    notes: "",
  });
  const [types, setTypes] = useState<TicketTypeForm[]>([{ ...EMPTY_TYPE }]);

  function addType() {
    setTypes((prev) => [...prev, { ...EMPTY_TYPE }]);
  }

  function updateType(index: number, patch: Partial<TicketTypeForm>) {
    setTypes((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function removeType(index: number) {
    setTypes((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) return setError("O título é obrigatório.");
    if (!form.startDate) return setError("A data de início é obrigatória.");

    const ticketTypes = types
      .filter((t) => t.name.trim())
      .map((t) => {
        const priceNum = Number(t.price);
        const quantityNum = Number(t.quantity);
        return {
          name: t.name.trim(),
          kind: t.kind,
          price: Number.isFinite(priceNum) && priceNum >= 0 ? priceNum : 0,
          quantity: Number.isInteger(quantityNum) && quantityNum >= 0 ? quantityNum : 0,
        };
      });

    setSaving(true);
    try {
      const res = await apiFetch<{ event: { id: string } }>("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          category: form.category || null,
          venue: form.venue.trim() || null,
          address: form.address.trim() || null,
          province: form.province.trim() || null,
          municipality: form.municipality.trim() || null,
          startDate: form.startDate,
          endDate: form.endDate || null,
          localPurchaseValue: Number(form.localPurchaseValue) || 0,
          totalTickets: Number(form.totalTickets) || 0,
          status: form.status,
          published: form.published,
          notes: form.notes.trim() || null,
        }),
      });

      // Cria os tipos de bilhete após criar o evento
      if (res.event?.id && ticketTypes.length > 0) {
        for (const tt of ticketTypes) {
          await apiFetch(`/api/events/${res.event.id}/ticket-types`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tt),
          });
        }
      }

      toast("Evento criado com sucesso!");
      router.push(`/eventos/${res.event.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar evento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/eventos" className="btn-icon btn-ghost" aria-label="Voltar aos eventos">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Ticket className="w-6 h-6 text-ib-accent" />
              Novo Evento
            </h1>
            <p className="page-subtitle">
              Crie um evento e defina os tipos de convite/ingresso/bilhete
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: "rgba(239, 68, 68, 0.3)",
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              color: "var(--color-ib-danger)",
            }}
          >
            {error}
          </div>
        )}

        <div className="card card-pad space-y-4">
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Informações do evento
          </h2>

          <div>
            <label className="label" htmlFor="ev-title">Título *</label>
            <input
              id="ev-title"
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              placeholder="Ex.: Festival da Música Angolana 2026"
            />
          </div>

          <div>
            <label className="label" htmlFor="ev-desc">Descrição</label>
            <textarea
              id="ev-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="textarea"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="ev-cat">Categoria</label>
              <select id="ev-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="select">
                <option value="">Selecionar</option>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{EVENT_CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="ev-status">Estado</label>
              <select id="ev-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="select">
                <option value="RASCUNHO">Rascunho</option>
                <option value="PUBLICADO">Publicado</option>
              </select>
            </div>

            <div>
              <label className="label" htmlFor="ev-venue">Local / Recinto</label>
              <input
                id="ev-venue"
                type="text"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className="input"
                placeholder="Ex.: Cine Atlântico"
              />
            </div>

            <div>
              <label className="label" htmlFor="ev-address">Endereço</label>
              <input
                id="ev-address"
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label" htmlFor="ev-province">Província</label>
              <input
                id="ev-province"
                type="text"
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label" htmlFor="ev-municipality">Município</label>
              <input
                id="ev-municipality"
                type="text"
                value={form.municipality}
                onChange={(e) => setForm({ ...form, municipality: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label" htmlFor="ev-start">Data de início *</label>
              <input
                id="ev-start"
                type="datetime-local"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label" htmlFor="ev-end">Data de fim</label>
              <input
                id="ev-end"
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label" htmlFor="ev-cost">Valor da compra local (Kz)</label>
              <input
                id="ev-cost"
                type="number"
                min="0"
                step="0.01"
                value={form.localPurchaseValue}
                onChange={(e) => setForm({ ...form, localPurchaseValue: e.target.value })}
                className="input"
                placeholder="Custo local do evento"
              />
            </div>

            <div>
              <label className="label" htmlFor="ev-total">Nº total de ingressos</label>
              <input
                id="ev-total"
                type="number"
                min="0"
                value={form.totalTickets}
                onChange={(e) => setForm({ ...form, totalTickets: e.target.value })}
                className="input"
                placeholder="Número de bilhetes previstos"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="ev-notes">Notas internas</label>
            <textarea
              id="ev-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="textarea"
            />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer select-none" style={{ color: "var(--text-muted)" }}>
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
              className="accent-ib-accent w-4 h-4"
            />
            Publicar imediatamente
          </label>
        </div>

        <div className="card card-pad space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                Tipos de bilhete
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Convites, ingressos ou bilhetes de entrada. Pode geri-los depois.
              </p>
            </div>
            <button type="button" onClick={addType} className="btn btn-secondary btn-sm">
              <Plus className="w-4 h-4" />
              Adicionar tipo
            </button>
          </div>

          {types.map((t, i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-end p-4 rounded-xl border"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div>
                <label className="label text-xs" htmlFor={`type-name-${i}`}>Nome</label>
                <input
                  id={`type-name-${i}`}
                  type="text"
                  value={t.name}
                  onChange={(e) => updateType(i, { name: e.target.value })}
                  className="input"
                  placeholder="Ex.: Ingresso normal"
                />
              </div>
              <div>
                <label className="label text-xs" htmlFor={`type-kind-${i}`}>Tipo</label>
                <select
                  id={`type-kind-${i}`}
                  value={t.kind}
                  onChange={(e) => updateType(i, { kind: e.target.value as typeof t.kind })}
                  className="select"
                >
                  <option value="CONVITE">Convite</option>
                  <option value="INGRESSO">Ingresso</option>
                  <option value="BILHETE">Bilhete de entrada</option>
                </select>
              </div>
              <div>
                <label className="label text-xs" htmlFor={`type-price-${i}`}>Preço (Kz)</label>
                <input
                  id={`type-price-${i}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={t.price}
                  onChange={(e) => updateType(i, { price: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label text-xs" htmlFor={`type-qty-${i}`}>Quantidade</label>
                <input
                  id={`type-qty-${i}`}
                  type="number"
                  min="0"
                  value={t.quantity}
                  onChange={(e) => updateType(i, { quantity: e.target.value })}
                  className="input"
                />
              </div>
              <button
                type="button"
                onClick={() => removeType(i)}
                className="btn-icon justify-self-start md:justify-self-auto text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                title="Remover tipo"
                aria-label="Remover tipo de bilhete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "A criar..." : "Criar Evento"}
          </button>
          <Link href="/eventos" className="btn btn-ghost">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}