"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  MapPin,
  Pencil,
  Ticket,
  TicketCheck,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { PageLoading } from "@/components/ui/boundaries/PageLoading";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import { apiFetch } from "@/lib/api";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { EVENT_STATUS_LABELS, EVENT_STATUS_BADGES } from "@/config/events";
import { StatCard, OverviewTab, TypesTab, TicketsTab, CheckinTab } from "./tabs";
import type { EventDetail } from "./tabs";

const TABS = [
  { key: "overview", label: "Visão Geral" },
  { key: "types", label: "Tipos de Bilhete" },
  { key: "tickets", label: "Bilhetes" },
  { key: "checkin", label: "Check-in" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function EventoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id: pid }) => setId(pid)).catch(() => setLoading(false));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      try {
        const data = await apiFetch<{ event: EventDetail }>(`/api/events/${id}`);
        setEvent(data.event);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar evento.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleDelete() {
    if (!(await confirm({ title: "Eliminar evento", message: "Tem a certeza que deseja eliminar este evento?", variant: "danger" }))) return;
    if (!event?.id) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/events/${event.id}`, { method: "DELETE" });
      toast("Evento eliminado com sucesso!");
      router.push("/eventos");
    } catch {
      toast("Erro ao eliminar evento.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/eventos" className="btn-icon btn-ghost shrink-0" aria-label="Voltar aos eventos">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          {event ? (
            <div className="flex-1 min-w-0">
              <h1 className="page-title flex items-center gap-2.5">
                <Ticket className="w-6 h-6 text-ib-accent shrink-0" />
                <span className="truncate">{event.title}</span>
                <span
                  className={`badge shrink-0 ${
                    EVENT_STATUS_BADGES[event.status as keyof typeof EVENT_STATUS_BADGES] ?? "badge-neutral"
                  }`}
                >
                  {EVENT_STATUS_LABELS[event.status as keyof typeof EVENT_STATUS_LABELS] ?? event.status}
                </span>
              </h1>
              <p className="page-subtitle flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {formatDateTime(event.startDate)}
                </span>
                {event.venue && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {event.venue}
                  </span>
                )}
              </p>
            </div>
          ) : (
            <h1 className="page-title">Evento</h1>
          )}
        </div>
        {event && (
          <div className="flex items-center gap-2">
            <Link href={`/eventos/${event.id}/editar`} className="btn btn-outline btn-sm">
              <Pencil className="w-4 h-4" />
              Editar
            </Link>
            <button onClick={handleDelete} disabled={deleting} className="btn btn-danger btn-sm">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Eliminar
            </button>
          </div>
        )}
      </div>

      {loading && <PageLoading />}

      {error && (
        <div
          className="rounded-xl border px-4 py-3 text-sm mb-6"
          style={{
            borderColor: "rgba(239, 68, 68, 0.3)",
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            color: "var(--color-ib-danger)",
          }}
        >
          {error}
        </div>
      )}

      {event && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Bilhetes emitidos" value={String(event.stats.ticketsIssued)} sub={`${event.stats.typesPlanned} planeados`} icon={<Ticket className="w-5 h-5" />} />
            <StatCard label="Check-ins" value={String(event.stats.ticketsCheckedIn)} sub={`${event.stats.ticketsValid} válidos`} icon={<TicketCheck className="w-5 h-5" />} />
            <StatCard label="Receita potencial" value={formatCurrency(event.stats.revenuePotential)} sub={`${formatCurrency(event.stats.costLocal)} custo local`} icon={<TrendingUp className="w-5 h-5" />} />
            <StatCard label="Margem potencial" value={formatCurrency(event.stats.marginPotential)} sub="Kz" icon={<CalendarDays className="w-5 h-5" />} />
          </div>

          {/* Tabs */}
          <div className="tabs-bar mb-6">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn("tab-btn", tab === t.key && "tab-btn-active")}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "overview" && <OverviewTab event={event} />}
          {tab === "types" && <TypesTab event={event} onChanged={(e) => setEvent(e)} />}
          {tab === "tickets" && (
            <TicketsTab eventId={event.id} event={event} setEvent={(e) => setEvent(e)} />
          )}
          {tab === "checkin" && <CheckinTab eventId={event.id} setEvent={(e) => setEvent(e)} />}
        </>
      )}
    </div>
  );
}