"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileWarning,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import Pagination from "@/components/Pagination";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  REGISTRATION_STATUS_BADGES,
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUSES,
  type RegistrationStatus,
} from "@/config/events";
import type { EventDetail } from "./tabs";

interface RegistrationItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  ticketType: { id: string; name: string; kind: string };
}

interface Registration {
  id: string;
  code: string;
  holderName: string;
  holderEmail: string;
  holderPhone: string;
  status: string;
  amount: number;
  paymentRef: string;
  proofUrl: string;
  proofMime: string;
  proofName: string | null;
  notes: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  items: RegistrationItem[];
}

interface RegistrationsResponse {
  event: { id: string; title: string; registrationToken: string | null };
  registrations: Registration[];
  statusCounts: Record<string, number>;
  total: number;
  totalPages: number;
}

export function RegistrationsTab({
  event,
  onChanged,
}: {
  event: EventDetail;
  onChanged?: (event: EventDetail) => void;
}) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [items, setItems] = useState<Registration[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const publicLink =
    typeof window !== "undefined" && event.registrationToken
      ? `${window.location.origin}/e/${event.registrationToken}`
      : "";
  const linkActive = event.published && event.status === "PUBLICADO";

  async function load(
    p = page,
    filters: { search?: string; status?: string } = {}
  ) {
    const activeSearch = filters.search ?? search;
    const activeStatus = filters.status ?? status;
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(p));
      qs.set("limit", "20");
      if (activeSearch) qs.set("search", activeSearch);
      if (activeStatus) qs.set("status", activeStatus);
      const res = await apiFetch<RegistrationsResponse>(
        `/api/events/${event.id}/registrations?${qs}`
      );
      setItems(res.registrations);
      setCounts(res.statusCounts ?? {});
      setTotalPages(Math.max(1, res.totalPages));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar inscrições.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      await load(1, { search: "", status: "" });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  async function refreshEvent() {
    if (!onChanged) return;
    try {
      const res = await apiFetch<{ event: EventDetail }>(`/api/events/${event.id}`);
      if (res.event) onChanged(res.event);
    } catch {
      // O dado principal da tabela já foi actualizado; falha ao actualizar stats não bloqueia.
    }
  }

  async function decide(registration: Registration, action: "APROVAR" | "REJEITAR" | "CANCELAR", rejectReason?: string) {
    setBusyId(registration.id);
    try {
      await apiFetch(`/api/events/${event.id}/registrations/${registration.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: rejectReason }),
      });
      toast(
        action === "APROVAR"
          ? "Inscrição aprovada; bilhetes emitidos."
          : action === "REJEITAR"
            ? "Inscrição rejeitada."
            : "Inscrição cancelada."
      );
      setRejectingId(null);
      setReason("");
      await load();
      await refreshEvent();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao analisar inscrição.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(registration: Registration) {
    const ok = await confirm({
      title: "Cancelar inscrição",
      message: `Cancelar a inscrição de ${registration.holderName}? A reserva dos bilhetes será libertada.`,
      variant: "danger",
    });
    if (ok) await decide(registration, "CANCELAR");
  }

  async function openProof(registration: Registration) {
    try {
      const res = await fetch(`/api/events/${event.id}/registrations/${registration.id}/proof`);
      if (!res.ok) throw new Error("Não foi possível abrir o comprovativo.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      if (!win) toast("Permita pop-ups para ver o comprovativo.", "error");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao abrir comprovativo.", "error");
    }
  }

  async function copyLink() {
    if (!publicLink) return;
    try {
      await navigator.clipboard.writeText(publicLink);
      toast("Link público copiado.");
    } catch {
      toast("Não foi possível copiar; seleccione o link manualmente.", "error");
    }
  }

  const columns: Column<Registration>[] = [
    {
      key: "code",
      header: "Inscrição",
      render: (r) => (
        <div className="min-w-0">
          <span className="font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {r.code}
          </span>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {formatDateTime(r.createdAt)}
          </p>
          <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            Ref.: {r.paymentRef}
          </p>
        </div>
      ),
    },
    {
      key: "holder",
      header: "Participante",
      render: (r) => (
        <div className="min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {r.holderName}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
            {r.holderEmail}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
            {r.holderPhone}
          </p>
        </div>
      ),
    },
    {
      key: "tickets",
      header: "Bilhetes",
      hide: "tablet",
      render: (r) => (
        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {r.items.map((item) => (
            <p key={item.id}>{item.quantity} × {item.ticketType.name}</p>
          ))}
        </div>
      ),
    },
    {
      key: "amount",
      header: "Total",
      hide: "tablet",
      render: (r) => (
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {formatCurrency(r.amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (r) => {
        const key = r.status as RegistrationStatus;
        return (
          <span className={`badge ${REGISTRATION_STATUS_BADGES[key] ?? "badge-neutral"}`}>
            {REGISTRATION_STATUS_LABELS[key] ?? r.status}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          {r.status !== "REJEITADA" && (
            <button
              onClick={() => openProof(r)}
              className="btn-icon btn-ghost"
              title="Ver comprovativo"
              aria-label="Ver comprovativo"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {r.status === "PENDENTE" && (
            <>
              {rejectingId === r.id ? (
                <div className="flex items-center gap-1">
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Motivo da rejeição"
                    maxLength={500}
                    className="input h-8 w-40 text-xs"
                    aria-label="Motivo da rejeição"
                  />
                  <button
                    onClick={() => decide(r, "REJEITAR", reason)}
                    disabled={busyId === r.id || !reason.trim()}
                    className="btn-icon text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    title="Confirmar rejeição"
                    aria-label="Confirmar rejeição"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setRejectingId(null); setReason(""); }}
                    className="btn-icon btn-ghost"
                    title="Cancelar"
                    aria-label="Cancelar rejeição"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => decide(r, "APROVAR")}
                    disabled={busyId === r.id}
                    className="btn-icon text-green-600 hover:bg-green-50 dark:hover:bg-green-950/40"
                    title="Aprovar e emitir bilhetes"
                    aria-label="Aprovar inscrição"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setRejectingId(r.id); setReason(""); }}
                    className="btn-icon text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                    title="Rejeitar"
                    aria-label="Rejeitar inscrição"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCancel(r)}
                    disabled={busyId === r.id}
                    className="btn-icon btn-ghost"
                    title="Cancelar inscrição"
                    aria-label="Cancelar inscrição"
                  >
                    <FileWarning className="w-4 h-4" />
                  </button>
                </>
              )}
            </>
          )}
          {busyId === r.id && <Loader2 className="w-4 h-4 animate-spin text-ib-accent" />}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="card card-pad space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Link público de inscrição
            </h3>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Qualquer pessoa com o link pode inscrever-se, sem iniciar sessão. O link só está
              activo quando o evento está publicado.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={copyLink} disabled={!publicLink} className="btn btn-outline btn-sm">
              <Copy className="w-4 h-4" /> Copiar link
            </button>
            {publicLink && (
              <a
                href={publicLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
              >
                <ExternalLink className="w-4 h-4" /> Abrir
              </a>
            )}
            <a
              href={`/api/events/${event.id}/registrations/export`}
              className="btn btn-primary btn-sm"
            >
              <Download className="w-4 h-4" /> Exportar CSV
            </a>
          </div>
        </div>

        <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--border-color)" }}>
          <code className="text-xs break-all" style={{ color: "var(--text-secondary)" }}>
            {publicLink || "Link indisponível — guarde e publique o evento para o activar."}
          </code>
        </div>
        {!linkActive && (
          <p className="text-xs" style={{ color: "var(--color-ib-danger)" }}>
            Evento não publicado: o link ainda não aceita inscrições. Publique o evento em «Editar».
          </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 z-[2]"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const term = e.currentTarget.value;
                setPage(1);
                void load(1, { search: term });
              }
            }}
            placeholder="Pesquisar por código, nome, email ou telefone..."
            className="input pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            const next = e.target.value;
            setStatus(next);
            setPage(1);
            void load(1, { status: next });
          }}
          className="select md:max-w-[210px]"
          aria-label="Filtrar por estado da inscrição"
        >
          <option value="">Todos os estados</option>
          {REGISTRATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {REGISTRATION_STATUS_LABELS[s]} ({counts[s] ?? 0})
            </option>
          ))}
        </select>
        <button onClick={() => { setPage(1); void load(1); }} className="btn btn-outline" aria-label="Pesquisar">
          <Search className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "rgba(239, 68, 68, 0.3)", backgroundColor: "rgba(239, 68, 68, 0.08)", color: "var(--color-ib-danger)" }}
        >
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        keyExtractor={(r) => r.id}
        emptyIcon={<FileWarning className="w-8 h-8" />}
        emptyText="Sem inscrições com estes filtros. Partilhe o link público para receber inscrições."
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => { setPage(p); void load(p); }}
      />

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        A exportação CSV inclui apenas inscrições pagas (validadas). A reserva de bilhetes
        considera também as inscrições pendentes para evitar overbooking.
      </p>
    </div>
  );
}
