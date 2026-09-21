"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Ticket, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user } = useAuth();
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

  const inputClass =
    "w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40";

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/eventos" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Ticket className="w-6 h-6 text-ib-accent" />
            Novo Evento
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Crie um evento e defina os tipos de convite/ingresso/bilhete
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="rounded-xl border p-6 space-y-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Informações do evento</h2>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
              Título *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
              Descrição
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Categoria
              </label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                <option value="">Selecionar</option>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{EVENT_CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Estado
              </label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                <option value="RASCUNHO">Rascunho</option>
                <option value="PUBLICADO">Publicado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Local / Recinto
              </label>
              <input
                type="text"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Endereço
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Província
              </label>
              <input
                type="text"
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Município
              </label>
              <input
                type="text"
                value={form.municipality}
                onChange={(e) => setForm({ ...form, municipality: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Data de início *
              </label>
              <input
                type="datetime-local"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Data de fim
              </label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Valor da compra local (Kz)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.localPurchaseValue}
                onChange={(e) => setForm({ ...form, localPurchaseValue: e.target.value })}
                className={inputClass}
                placeholder="Custo local do evento"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Nº total de ingressos
              </label>
              <input
                type="number"
                min="0"
                value={form.totalTickets}
                onChange={(e) => setForm({ ...form, totalTickets: e.target.value })}
                className={inputClass}
                placeholder="Número de bilhetes previstos"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
              Notas internas
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={inputClass}
            />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-muted)" }}>
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
              className="accent-ib-accent"
            />
            Publicar imediatamente
          </label>
        </div>

        <div className="rounded-xl border p-6 space-y-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
              Tipos de bilhete
            </h2>
            <button
              type="button"
              onClick={addType}
              className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-ib-accent hover:bg-blue-700 text-white font-medium"
            >
              <Plus className="w-4 h-4" />
              Adicionar tipo
            </button>
          </div>

          {types.map((t, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-end p-3 rounded-lg border" style={{ borderColor: "var(--border-color)" }}>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Nome</label>
                <input
                  type="text"
                  value={t.name}
                  onChange={(e) => updateType(i, { name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
                  placeholder="Ex.: Igresso normal"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Tipo</label>
                <select
                  value={t.kind}
                  onChange={(e) => updateType(i, { kind: e.target.value as typeof t.kind })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                >
                  <option value="CONVITE">Convite</option>
                  <option value="INGRESSO">Ingresso</option>
                  <option value="BILHETE">Bilhete de entrada</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Preço (Kz)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={t.price}
                  onChange={(e) => updateType(i, { price: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Quantidade</label>
                <input
                  type="number"
                  min="0"
                  value={t.quantity}
                  onChange={(e) => updateType(i, { quantity: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => removeType(i)}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                title="Remover tipo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "A criar..." : "Criar Evento"}
          </button>
          <Link href="/eventos" className="text-sm px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
