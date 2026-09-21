"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  MapPin,
  Plus,
  Printer,
  Search,
  Ticket,
  TicketCheck,
  Trash2,
} from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import Pagination from "@/components/Pagination";
import { apiFetch } from "@/lib/api";
import { toNumber } from "@/lib/money";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { EVENT_CATEGORY_LABELS, TICKET_KIND_LABELS, TICKET_STATUS_LABELS, TICKET_STATUS_BADGES } from "@/config/events";

/* ------------------------------------------------------------------ */
/* Tipos                                                                */
/* ------------------------------------------------------------------ */

export interface TicketType {
  id: string;
  name: string;
  kind: "CONVITE" | "INGRESSO" | "BILHETE";
  price: number;
  quantity: number;
  active: boolean;
  ticketsIssued: number;
}

export interface Ticket {
  id: string;
  code: string;
  holderName: string | null;
  holderEmail: string | null;
  holderPhone: string | null;
  status: "VALIDO" | "USADO" | "CANCELADO";
  checkedIn: boolean;
  checkedInAt: string | null;
  ticketTypeId: string | null;
  ticketTypeName: string | null;
  ticketTypeKind: "CONVITE" | "INGRESSO" | "BILHETE" | null;
  price: number;
}

export interface EventDetail {
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
  localPurchaseValue: number;
  totalTickets: number;
  status: string;
  published: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  ticketTypes: TicketType[];
  stats: {
    totalPlanned: number;
    typesPlanned: number;
    ticketsIssued: number;
    ticketsCheckedIn: number;
    ticketsCancelled: number;
    ticketsValid: number;
    revenuePotential: number;
    revenueIssued: number;
    costLocal: number;
    marginPotential: number;
  };
}

/* ------------------------------------------------------------------ */
/* StatCard                                                             */
/* ------------------------------------------------------------------ */

export function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
}) {
  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
          <p className="text-xl font-bold mt-1 truncate" style={{ color: "var(--text-primary)" }}>{value}</p>
          {sub && <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{sub}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}
        >
          <span className="text-ib-accent">{icon}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* OverviewTab                                                          */
/* ------------------------------------------------------------------ */

export function OverviewTab({ event }: { event: EventDetail }) {
  return (
    <div className="space-y-4">
      <div className="card card-pad">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Detalhes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
          <div>
            <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Descrição</span>
            <p className="mt-1" style={{ color: "var(--text-primary)" }}>{event.description || "—"}</p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Categoria</span>
            <p className="mt-1" style={{ color: "var(--text-primary)" }}>
              {event.category ? (EVENT_CATEGORY_LABELS[event.category as keyof typeof EVENT_CATEGORY_LABELS] ?? event.category) : "—"}
            </p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Data</span>
            <p className="mt-1 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
              <CalendarDays className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
              {formatDateTime(event.startDate)}
              {event.endDate ? ` — ${formatDateTime(event.endDate)}` : ""}
            </p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Local</span>
            <p className="mt-1 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
              <MapPin className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
              {[event.venue, event.municipality, event.province].filter(Boolean).join(", ") || "—"}
            </p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Valor da compra local</span>
            <p className="mt-1 font-medium" style={{ color: "var(--text-primary)" }}>{formatCurrency(event.localPurchaseValue)}</p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Bilhetes planeados</span>
            <p className="mt-1 font-medium" style={{ color: "var(--text-primary)" }}>{event.totalTickets}</p>
          </div>
        </div>
      </div>

      {event.notes && (
        <div className="card card-pad">
          <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Notas internas</h3>
          <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-muted)" }}>{event.notes}</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TypesTab                                                             */
/* ------------------------------------------------------------------ */

export function TypesTab({
  event,
  onChanged,
}: {
  event: EventDetail;
  onChanged?: (event: EventDetail) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", kind: "INGRESSO" as const, price: "", quantity: "" });

  async function refresh() {
    const res = await apiFetch<{ event: EventDetail }>(`/api/events/${event.id}`);
    if (res.event) onChanged?.(res.event);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("O nome é obrigatório.");
    setSaving(true);
    try {
      await apiFetch<{ ticketType: { id: string } }>(`/api/events/${event.id}/ticket-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          kind: form.kind,
          price: toNumber(form.price),
          quantity: Number.isInteger(Number(form.quantity)) && Number(form.quantity) > 0 ? Number(form.quantity) : 0,
          active: true,
        }),
      });
      setOpen(false);
      setForm({ name: "", kind: "INGRESSO", price: "", quantity: "" });
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar tipo de bilhete.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(t: TicketType) {
    await apiFetch(`/api/events/${event.id}/ticket-types/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !t.active }),
    });
    await refresh();
  }

  async function handleDelete(t: TicketType) {
    await apiFetch(`/api/events/${event.id}/ticket-types/${t.id}`, { method: "DELETE" });
    await refresh();
  }

  const columns: Column<TicketType>[] = [
    {
      key: "name",
      header: "Nome",
      render: (t) => (
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t.name}</span>
      ),
    },
    {
      key: "kind",
      header: "Tipo",
      render: (t) => (
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>{TICKET_KIND_LABELS[t.kind] ?? t.kind}</span>
      ),
    },
    {
      key: "price",
      header: "Preço",
      hide: "tablet",
      render: (t) => (
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{formatCurrency(t.price)}</span>
      ),
    },
    {
      key: "quantity",
      header: "Quantidade",
      hide: "tablet",
      render: (t) => (
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{t.quantity}</span>
      ),
    },
    {
      key: "issued",
      header: "Emitidos",
      render: (t) => (
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{t.ticketsIssued}</span>
      ),
    },
    {
      key: "active",
      header: "Estado",
      render: (t) => (
        <span className={`badge ${t.active ? "badge-success" : "badge-neutral"}`}>
          {t.active ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (t) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => toggleActive(t)}
            className="btn-icon btn-ghost"
            title={t.active ? "Desactivar" : "Activar"}
            aria-label={t.active ? "Desactivar tipo" : "Activar tipo"}
          >
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </button>
          <button
            onClick={() => handleDelete(t)}
            className="btn-icon text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
            title="Eliminar"
            aria-label="Eliminar tipo de bilhete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Define os tipos de bilhete deste evento (convites, ingressos, bilhetes de entrada).
        </p>
        <button onClick={() => setOpen((v) => !v)} className="btn btn-primary btn-sm self-start">
          <Plus className="w-4 h-4" />
          Novo Tipo
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="card card-pad space-y-3">
          {error && <p className="text-sm" style={{ color: "var(--color-ib-danger)" }}>{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-1">
              <label className="label text-xs" htmlFor="type-name">Nome *</label>
              <input
                id="type-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="Ex.: Ingresso VIP"
              />
            </div>
            <div>
              <label className="label text-xs" htmlFor="type-kind">Tipo</label>
              <select
                id="type-kind"
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as typeof form.kind })}
                className="select"
              >
                <option value="CONVITE">Convite</option>
                <option value="INGRESSO">Ingresso</option>
                <option value="BILHETE">Bilhete de entrada</option>
              </select>
            </div>
            <div>
              <label className="label text-xs" htmlFor="type-price">Preço (Kz)</label>
              <input
                id="type-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label text-xs" htmlFor="type-qty">Quantidade</label>
              <input
                id="type-qty"
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="input"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={saving} className="btn btn-primary w-full justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Criar
              </button>
            </div>
          </div>
        </form>
      )}

      <DataTable
        columns={columns}
        data={event.ticketTypes}
        loading={false}
        keyExtractor={(t) => t.id}
        emptyIcon={<Ticket className="w-8 h-8" />}
        emptyText="Sem tipos de bilhete. Crie o primeiro tipo acima."
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TicketsTab                                                           */
/* ------------------------------------------------------------------ */

export function TicketsTab({
  eventId,
  event,
  setEvent,
}: {
  eventId: string;
  event: EventDetail;
  setEvent: (e: EventDetail) => void;
}) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [issuing, setIssuing] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ticketTypeId: "", quantity: "1", holderName: "", holderEmail: "" });

  async function load(p = page) {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(p));
      qs.set("limit", "20");
      if (search) qs.set("search", search);
      if (status) qs.set("status", status);
      const res = await apiFetch<{ tickets: Ticket[]; total: number }>(`/api/events/${eventId}/tickets?${qs}`);
      setTickets(res.tickets);
      setTotal(res.total);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }

  async function checkin(t: Ticket) {
    await apiFetch(`/api/events/${eventId}/tickets/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkedIn: true }),
    });
    setTickets((prev) =>
      prev.map((x) =>
        x.id === t.id ? { ...x, checkedIn: true, status: "USADO", checkedInAt: new Date().toISOString() } : x
      )
    );
    const res = await apiFetch<{ event: EventDetail }>(`/api/events/${eventId}`);
    if (res.event) setEvent(res.event);
  }

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault();
    setIssuing(true);
    try {
      await apiFetch(`/api/events/${eventId}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketTypeId: form.ticketTypeId,
          quantity: Math.max(1, Number(form.quantity) || 1),
          holderName: form.holderName.trim() || null,
          holderEmail: form.holderEmail.trim() || null,
        }),
      });
      setOpen(false);
      setForm({ ticketTypeId: "", quantity: "1", holderName: "", holderEmail: "" });
      await load();
      const res = await apiFetch<{ event: EventDetail }>(`/api/events/${eventId}`);
      if (res.event) setEvent(res.event);
    } finally {
      setIssuing(false);
    }
  }

  const columns: Column<Ticket>[] = [
    {
      key: "code",
      header: "Código",
      render: (t) => (
        <span className="font-mono text-sm font-medium tracking-wide" style={{ color: "var(--text-primary)" }}>{t.code}</span>
      ),
    },
    {
      key: "holder",
      header: "Titular",
      render: (t) => (
        <div className="min-w-0">
          <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>{t.holderName || "—"}</p>
          {t.holderEmail && <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{t.holderEmail}</p>}
        </div>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      hide: "tablet",
      render: (t) => (
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>{t.ticketTypeName || "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (t) => (
        <span className={`badge ${TICKET_STATUS_BADGES[t.status] ?? "badge-neutral"}`}>
          {TICKET_STATUS_LABELS[t.status] ?? t.status}
        </span>
      ),
    },
    {
      key: "checkin",
      header: "Check-in",
      hide: "tablet",
      render: (t) => (
        <span className="text-sm" style={{ color: t.checkedIn ? "var(--text-primary)" : "var(--text-muted)" }}>
          {t.checkedIn ? (t.checkedInAt ? formatDateTime(t.checkedInAt) : "Feito") : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (t) => (
        <div className="flex items-center justify-end gap-1">
          {!t.checkedIn && t.status === "VALIDO" && (
            <button
              onClick={() => checkin(t)}
              className="btn-icon text-green-600 hover:bg-green-50 dark:hover:bg-green-950/40"
              title="Marcar check-in"
              aria-label="Marcar check-in"
            >
              <TicketCheck className="w-4 h-4" />
            </button>
          )}
          <Link
            href={`/eventos/${eventId}/bilhetes/${t.id}`}
            className="btn-icon btn-ghost"
            title="Ver bilhete"
            aria-label="Ver bilhete"
          >
            <Printer className="w-4 h-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 z-[2]"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") load(); }}
            placeholder="Pesquisar por código, nome ou email..."
            className="input pl-9"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="select md:max-w-[170px]" aria-label="Filtrar por estado do bilhete">
          <option value="">Todos os estados</option>
          <option value="VALIDO">Válido</option>
          <option value="USADO">Usado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
        <button onClick={() => load()} className="btn btn-outline" aria-label="Pesquisar">
          <Search className="w-4 h-4" />
        </button>
        <button onClick={() => setOpen((v) => !v)} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Emitir
        </button>
      </div>

      {open && (
        <form
          onSubmit={handleIssue}
          className="card card-pad grid grid-cols-1 md:grid-cols-6 gap-3"
        >
          <div className="md:col-span-2">
            <label className="label text-xs" htmlFor="issue-type">Tipo de bilhete *</label>
            <select
              id="issue-type"
              required
              value={form.ticketTypeId}
              onChange={(e) => setForm({ ...form, ticketTypeId: e.target.value })}
              className="select"
            >
              <option value="">Selecionar</option>
              {event.ticketTypes.filter((t) => t.active).map((t) => (
                <option key={t.id} value={t.id}>{t.name} — {formatCurrency(t.price)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs" htmlFor="issue-qty">Quantidade</label>
            <input
              id="issue-qty"
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label text-xs" htmlFor="issue-name">Nome do titular</label>
            <input
              id="issue-name"
              value={form.holderName}
              onChange={(e) => setForm({ ...form, holderName: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label text-xs" htmlFor="issue-email">Email</label>
            <input
              id="issue-email"
              type="email"
              value={form.holderEmail}
              onChange={(e) => setForm({ ...form, holderEmail: e.target.value })}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={issuing} className="btn btn-primary w-full justify-center">
              {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
              Emitir
            </button>
          </div>
        </form>
      )}

      <DataTable
        columns={columns}
        data={tickets}
        loading={loading}
        keyExtractor={(t) => t.id}
        emptyIcon={<Ticket className="w-8 h-8" />}
        emptyText="Sem bilhetes emitidos. Emita o primeiro bilhete acima."
      />

      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / 20))} onPageChange={(p) => { setPage(p); load(p); }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CheckinTab                                                           */
/* ------------------------------------------------------------------ */

export function CheckinTab({
  eventId,
  setEvent,
}: {
  eventId: string;
  setEvent: (e: EventDetail) => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      await apiFetch<{ success: true }>(
        "/api/events/checkin",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code.trim() }) }
      );
      setResult({ ok: true, message: "Check-in efetuado com sucesso!" });
      setCode("");
      const eventRes = await apiFetch<{ event: EventDetail }>(`/api/events/${eventId}`);
      if (eventRes.event) setEvent(eventRes.event);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bilhete inválido.";
      setResult({ ok: false, message: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="card card-pad space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Verificação à porta</h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Verifique o código do bilhete na entrada. A validação funciona por código único, sem depender do evento.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="label" htmlFor="ck-code">Código do bilhete</label>
          <input
            id="ck-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="IB-XXXXX-XXXXX"
            className="input font-mono tracking-widest py-3"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="btn btn-primary w-full sm:w-auto"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TicketCheck className="w-4 h-4" />}
            Validar e fazer check-in
          </button>
        </form>
        {result && (
          <div
            role="status"
            className={`rounded-xl border px-4 py-3 text-sm ${
              result.ok
                ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300"
                : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300"
            }`}
          >
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}