"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Pencil, Upload, Save } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { parseEventDateTime } from "@/lib/events";
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS, EVENT_STATUS_LABELS } from "@/config/events";

const inputClass =
  "rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40";
const inputStyle = {
  backgroundColor: "var(--bg-primary)",
  borderColor: "var(--border-color)",
  color: "var(--text-primary)",
};
const saveClass =
  "relative flex items-center justify-center gap-2 rounded-lg bg-ib-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";
const saveStyle = { backgroundColor: "var(--accent-color, #2563eb)" };

interface EventForm {
  title: string;
  description: string;
  category: string;
  venue: string;
  address: string;
  province: string;
  municipality: string;
  startDate: string;
  endDate: string;
  localPurchaseValue: string;
  totalTickets: string;
  notes: string;
  status: string;
  coverImage: string;
  published: boolean;
}

export default function EditarEventoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<EventForm>({
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
    notes: "",
    status: "RASCUNHO",
    coverImage: "",
    published: false,
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await apiFetch<{ event: EventForm & { id: string } }>(`/api/events/${id}`);
        const e = res.event;
        setForm({
          title: e.title ?? "",
          description: e.description ?? "",
          category: e.category ?? "",
          venue: e.venue ?? "",
          address: e.address ?? "",
          province: e.province ?? "",
          municipality: e.municipality ?? "",
          startDate: e.startDate ? startDateTimeLocal(e.startDate) : "",
          endDate: e.endDate ? startDateTimeLocal(e.endDate) : "",
          localPurchaseValue: String(e.localPurchaseValue ?? ""),
          totalTickets: String(e.totalTickets ?? ""),
          notes: e.notes ?? "",
          status: e.status ?? "RASCUNHO",
          coverImage: e.coverImage ?? "",
          published: e.published ?? false,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar evento.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Converter ISO (instante UTC do evento) para o valor esperado por <input type="datetime-local">,
  // expresso no fuso da empresa (Africa/Luanda).
  function startDateTimeLocal(iso: string): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Luanda",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast("O ficheiro deve ser uma imagem.", "error");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const res = await apiFetch<{ url: string }>("/api/upload", { method: "POST", body: fd });
      setForm({ ...form, coverImage: res.url });
      toast("Imagem enviada.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao enviar imagem.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("O título é obrigatório.");
    if (!form.startDate) return setError("A data de início é obrigatória.");

    setSaving(true);
    try {
      await apiFetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          category: form.category || null,
          venue: form.venue.trim() || null,
          address: form.address.trim() || null,
          province: form.province.trim() || null,
          municipality: form.municipality.trim() || null,
          startDate: (parseEventDateTime(form.startDate) ?? new Date()).toISOString(),
          endDate: form.endDate ? (parseEventDateTime(form.endDate) ?? new Date()).toISOString() : null,
          status: form.status,
          localPurchaseValue: Number(form.localPurchaseValue) || 0,
          totalTickets: Number(form.totalTickets) || 0,
          notes: form.notes.trim() || null,
          published: form.published,
        }),
      });
      toast("Evento atualizado com sucesso!");
      router.push(`/eventos/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar evento.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/eventos/${id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Pencil className="w-6 h-6 text-ib-accent" />
            Editar Evento
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Atualize os dados do evento e a configuração de ingressos.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5 rounded-xl border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
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
              <option value="RASCUNHO">Rascunho</option>
              <option value="PUBLICADO">Publicado</option>
              <option value="CANCELADO">Cancelado</option>
              <option value="CONCLUIDO">Concluído</option>
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
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Valor da compra local (Kz)</label>
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
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Nº total de ingressos</label>
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

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Capa</label>
          {form.coverImage ? (
            <div className="mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.coverImage} alt="Capa do evento" className="h-32 w-full rounded-lg object-cover" />
            </div>
          ) : null}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800" style={{ borderColor: "var(--border-color)" }}>
            <Upload className="w-4 h-4" />
            {uploading ? "A enviar..." : "Enviar imagem"}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
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
            className={saveClass}
            style={saveStyle}
          >
            <Save className="w-4 h-4" />
            {saving ? "A guardar..." : "Guardar alterações"}
          </button>
          <Link href={`/eventos/${id}`} className="text-sm px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
