"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Ticket } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS } from "@/config/events";

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
    status: "PUBLICADO",
    localPurchaseValue: "",
    totalTickets: "",
    notes: "",
    published: true,
  });

  const inputClass =
    "w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40";
  const inputStyle = { backgroundColor: "var(--bg-primary)", borderColor: "var(--border-color)", color: "var(--text-primary)" };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("O título é obrigatório.");
    if (!form.startDate) return setError("A data de início é obrigatória.");

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
          status: form.status,
          localPurchaseValue: Number(form.localPurchaseValue) || 0,
          totalTickets: Number(form.totalTickets) || 0,
          notes: form.notes.trim() || null,
          published: form.published,
        }),
      });

      toast("Evento criado com sucesso!");
      router.push(`/eventos/${res.event.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar evento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/eventos" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Ticket className="w-6 h-6 text-ib-accent" />
            Novo Evento
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Crie um evento e adicione tipos de bilhete (convite, ingresso, bilhete de entrada)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5 rounded-xl border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Título *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={`${inputClass} w-full`}
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Descrição</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={`${inputClass} w-full`}
            style={inputStyle}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Categoria</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={`${inputClass} w-full`}
              style={inputStyle}
            >
              <option value="">Selecionar</option>
              {EVENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{EVENT_CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Estado</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={`${inputClass} w-full`}
              style={inputStyle}
            >
              <option value="PUBLICADO">Publicado</option>
              <option value="RASCUNHO">Rascunho</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Local / Recinto</label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              className={`${inputClass} w-full`}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Endereço</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={`${inputClass} w-full`}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Província</label>
            <input
              type="text"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
              className={`${inputClass} w-full`}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Município</label>
            <input
              type="text"
              value={form.municipality}
              onChange={(e) => setForm({ ...form, municipality: e.target.value })}
              className={`${inputClass} w-full`}
              style={inputStyle}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Data de início *</label>
            <input
              type="datetime-local"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className={`${inputClass} w-full`}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Data de fim</label>
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className={`${inputClass} w-full`}
              style={inputStyle}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className={`${inputClass} w-full`}
              style={inputStyle}
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
              className={`${inputClass} w-full`}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Notas internas</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={`${inputClass} w-full`}
            style={inputStyle}
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

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "A criar..." : "Criar Evento"}
          </button>
          <Link href="/eventos" className="text-sm px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
