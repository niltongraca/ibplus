"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Pencil, Upload, Save } from "lucide-react";
import { PageLoading } from "@/components/ui/boundaries/PageLoading";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { parseEventDateTime } from "@/lib/events";
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS } from "@/config/events";

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
    return <PageLoading />;
  }

  return (
    <div className="max-w-2xl">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href={`/eventos/${id}`} className="btn-icon btn-ghost" aria-label="Voltar ao evento">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Pencil className="w-6 h-6 text-ib-accent" />
              Editar Evento
            </h1>
            <p className="page-subtitle">Atualize os dados do evento e a configuração de ingressos.</p>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="mb-6 rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: "rgba(239, 68, 68, 0.3)",
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            color: "var(--color-ib-danger)",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card card-pad space-y-5">
        <div>
          <label className="label" htmlFor="ev-title">Título *</label>
          <input
            id="ev-title"
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input"
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
            <select
              id="ev-cat"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="select"
            >
              <option value="">Selecionar</option>
              {EVENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{EVENT_CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ev-status">Estado</label>
            <select
              id="ev-status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="select"
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
            <label className="label" htmlFor="ev-venue">Local / Recinto</label>
            <input
              id="ev-venue"
              type="text"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              className="input"
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div>
          <span className="label">Capa</span>
          {form.coverImage ? (
            <div className="mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.coverImage} alt="Capa do evento" className="h-32 w-full rounded-xl object-cover" />
            </div>
          ) : null}
          <label className="btn btn-outline cursor-pointer">
            <Upload className="w-4 h-4" />
            {uploading ? "A enviar..." : "Enviar imagem"}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
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

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn btn-primary">
            <Save className="w-4 h-4" />
            {saving ? "A guardar..." : "Guardar alterações"}
          </button>
          <Link href={`/eventos/${id}`} className="btn btn-ghost">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}