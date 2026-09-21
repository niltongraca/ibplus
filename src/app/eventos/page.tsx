"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Pencil, Plus, Search, Ticket, TrendingUp } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { ClearInput } from "@/components/ui/ClearInput";
import Pagination from "@/components/Pagination";
import { useList } from "@/hooks/useList";
import { formatEventDate } from "@/lib/events";
import { formatCurrency } from "@/lib/utils";
import {
  EVENT_STATUSES,
  EVENT_STATUS_LABELS,
  EVENT_STATUS_BADGES,
} from "@/config/events";

interface EventItem {
  id: string;
  title: string;
  category: string | null;
  venue: string | null;
  startDate: string;
  endDate: string | null;
  status: string;
  published: boolean;
  coverImage: string | null;
  localPurchaseValue: number;
  totalTickets: number;
  ticketTypesCount: number;
  ticketsIssued: number;
  ticketsCheckedIn: number;
  revenuePotential: number;
  createdAt: string;
}

export default function EventosPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data: events, loading, page, setPage, totalPages } = useList<EventItem>(
    "/api/events",
    "events",
    { limit: 20, params: { search, status: status || undefined } }
  );

  const columns: Column<EventItem>[] = [
    {
      key: "title",
      header: "Evento",
      render: (e) => (
        <div className="min-w-0">
          <Link
            href={`/eventos/${e.id}`}
            className="font-medium hover:text-ib-accent transition-colors"
            style={{ color: "var(--text-primary)" }}
          >
            {e.title}
          </Link>
          {e.venue && (
            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <MapPin className="w-3 h-3" /> {e.venue}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "date",
      header: "Data",
      hide: "tablet",
      render: (e) => (
        <span className="text-sm flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
          <CalendarDays className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
          {formatEventDate(e.startDate)}
        </span>
      ),
    },
    {
      key: "tickets",
      header: "Bilhetes",
      render: (e) => {
        const pct =
          e.totalTickets > 0 ? Math.min(100, Math.round((e.ticketsIssued / e.totalTickets) * 100)) : 0;
        return (
          <div className="min-w-[120px]">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {e.ticketsIssued} <span style={{ color: "var(--text-muted)" }}>/ {e.totalTickets || "—"}</span>
            </p>
            {e.totalTickets > 0 && (
              <div
                className="mt-1.5 h-1.5 w-full rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <div className="h-full rounded-full bg-ib-accent transition-all" style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "checkin",
      header: "Check-in",
      hide: "mobile",
      render: (e) => (
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {e.ticketsCheckedIn}
        </span>
      ),
    },
    {
      key: "revenue",
      header: "Receita potencial",
      hide: "tablet",
      render: (e) => (
        <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
          <TrendingUp className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
          {formatCurrency(e.revenuePotential)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      hide: "mobile",
      render: (e) => (
        <span className={`badge ${EVENT_STATUS_BADGES[e.status as keyof typeof EVENT_STATUS_BADGES] ?? "badge-neutral"}`}>
          {EVENT_STATUS_LABELS[e.status as keyof typeof EVENT_STATUS_LABELS] ?? e.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (e) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/eventos/${e.id}`} className="btn-icon btn-ghost" title="Ver evento" aria-label="Ver evento">
            <Ticket className="w-4 h-4 text-ib-accent" />
          </Link>
          <Link
            href={`/eventos/${e.id}/editar`}
            className="btn-icon btn-ghost"
            title="Editar evento"
            aria-label="Editar evento"
          >
            <Pencil className="w-4 h-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Eventos</h1>
          <p className="page-subtitle">Gestão de eventos, tipos de bilhete e check-in à porta</p>
        </div>
        <Link href="/eventos/novo" className="btn btn-primary">
          <Plus className="w-4 h-4" /> Novo Evento
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div
          className="p-4 border-b flex flex-col sm:flex-row gap-3"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-[2]"
              style={{ color: "var(--text-muted)" }}
            />
            <ClearInput value={search} onChange={setSearch} placeholder="Pesquisar eventos..." />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="select sm:max-w-[190px]"
            aria-label="Filtrar por estado"
          >
            <option value="">Todos os estados</option>
            {EVENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {EVENT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          columns={columns}
          data={events}
          loading={loading}
          keyExtractor={(e) => e.id}
          emptyIcon={<Ticket className="w-8 h-8" />}
          emptyText={search || status ? "Sem eventos com estes filtros." : "Ainda não há eventos."}
          mobileCard={(e) => (
            <Link href={`/eventos/${e.id}`} className="block">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {e.title}
                </p>
                <span className={`badge shrink-0 ${EVENT_STATUS_BADGES[e.status as keyof typeof EVENT_STATUS_BADGES] ?? "badge-neutral"}`}>
                  {EVENT_STATUS_LABELS[e.status as keyof typeof EVENT_STATUS_LABELS] ?? e.status}
                </span>
              </div>
              <div className="text-sm space-y-1" style={{ color: "var(--text-muted)" }}>
                <p className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> {formatEventDate(e.startDate)}
                </p>
                {e.venue && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {e.venue}
                  </p>
                )}
                <p>
                  {e.ticketsIssued} / {e.totalTickets || "—"} bilhetes ·{" "}
                  {e.ticketsCheckedIn} check-ins
                </p>
              </div>
            </Link>
          )}
        />

        <div className="px-4 pb-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}