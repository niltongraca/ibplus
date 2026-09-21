"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Printer,
  Search,
  Ticket,
  Trash2,
  TicketCheck,
  TrendingUp,
} from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { toNumber } from "@/lib/money";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { EVENT_CATEGORY_LABELS, EVENT_STATUS_LABELS, EVENT_STATUS_STYLES } from "@/config/events";
import { TICKET_KIND_LABELS, TICKET_STATUS_LABELS, TICKET_STATUS_STYLES } from "@/config/events";
import { StatCard, OverviewTab, TypesTab, TicketsTab, CheckinTab } from "./tabs";

interface TicketType {
  id: string;
  name: string;
  kind: "CONVITE" | "INGRESSO" | "BILHETE";
  price: number;
  quantity: number;
  active: boolean;
  ticketsIssued: number;
}

interface Ticket {
  id: string;
  code: string;
  holderName: string | null;
  holderEmail: string | null;
  holderPhone: string | null;
  status: "VALIDO" | "USADO" | "CANCELADO";
  checkedIn: boolean;
  checkedInAt: string | null;
  ticketTypeName: string | null;
  ticketTypeKind: "CONVITE" | "INGRESSO" | "BILHETE" | null;
  price: number;
}

interface EventDetail {
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
  const { user } = useAuth();
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

  // ---- Bilhetes ----
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatus, setTicketStatus] = useState("");
  const [ticketsTotal, setTicketsTotal] = useState(0);
  const [ticketPage, setTicketPage] = useState(1);
  const [issuing, setIssuing] = useState(false);

  // ---- Emissão ----
  const [issueOpen, setIssueOpen] = useState(false);
  const [issue, setIssue] = useState({
    ticketTypeId: "",
    quantity: "1",
    holderName: "",
    holderEmail: "",
    holderPhone: "",
  });

  // ---- Checkin ----
  const [checkinCode, setCheckinCode] = useState("");
  const [checkinLoading, setCheckinLoading] = useState(false);

  const inputClass =
    "w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40";
  const inputStyle = {
    backgroundColor: "var(--bg-primary)",
    borderColor: "var(--border-color)",
    color: "var(--text-primary)",
  } as const;

  const paramId = useMemo(() => id, [id]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/eventos" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        {event ? (
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Ticket className="w-6 h-6 text-ib-accent" />
              <span className="truncate">{event.title}</span>
            </h1>
            <p className="text-sm flex items-center gap-4" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {formatDateTime(event.startDate)}
              </span>
              {event.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {event.venue}
                </span>
              )}
            </p>
          </div>
        ) : (
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Evento</h1>
        )}
        {event && (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                EVENT_STATUS_STYLES?.[event.status as keyof typeof EVENT_STATUS_STYLES] ?? ""
              }`}
            >
              {EVENT_STATUS_LABELS[event.status as keyof typeof EVENT_STATUS_LABELS] ?? event.status}
            </span>
            <Link
              href={`/eventos/${event.id}/editar`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border text-red-500 hover:bg-red-50 text-sm disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Eliminar
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="p-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          A carregar evento...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 mb-6">{error}</div>
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
          <div className="flex items-center gap-1 border-b mb-6 overflow-x-auto" style={{ borderColor: "var(--border-color)" }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  tab === t.key ? "border-ib-accent" : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
                style={{ color: tab === t.key ? "var(--text-primary)" : "var(--text-muted)" }}
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
