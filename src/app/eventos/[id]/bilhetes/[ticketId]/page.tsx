"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer, Ticket } from "lucide-react";
import { PageLoading } from "@/components/ui/boundaries/PageLoading";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { TICKET_KIND_LABELS, TICKET_STATUS_LABELS, TICKET_STATUS_BADGES } from "@/config/events";
import SmartImage from "@/components/SmartImage";

interface TicketEvent {
  id: string;
  title: string;
  venue: string | null;
  coverImage: string | null;
  startDate: string;
}

interface TicketDetail {
  id: string;
  code: string;
  holderName: string | null;
  holderEmail: string | null;
  price: number;
  status: "VALIDO" | "USADO" | "CANCELADO";
  checkedIn: boolean;
  checkedInAt: string | null;
  issuedAt: string;
  ticketTypeName: string | null;
  ticketTypeKind: "CONVITE" | "INGRESSO" | "BILHETE" | null;
  event: TicketEvent;
}

export default function BilhetePage() {
  const params = useParams<{ id: string; ticketId: string }>();
  const id = params.id ?? "";
  const ticketId = params.ticketId ?? "";
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !ticketId) return;
    (async () => {
      try {
        const res = await apiFetch<{ ticket: TicketDetail }>(
          `/api/events/${id}/tickets/${ticketId}`
        );
        setTicket(res.ticket);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar bilhete.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, ticketId]);

  if (loading) {
    return <PageLoading />;
  }

  if (error || !ticket) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center">
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{error || "Bilhete não encontrado."}</p>
        <Link href={`/eventos/${id}`} className="text-sm font-medium text-ib-accent hover:underline">
          Voltar ao evento
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href={`/eventos/${id}`} className="btn-icon btn-ghost" aria-label="Voltar ao evento">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Ticket className="w-6 h-6 text-ib-accent" />
              Bilhete
            </h1>
            <p className="page-subtitle">Código único para check-in à porta</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="btn btn-primary no-print">
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
      </div>

      <div
        className="mx-auto max-w-md rounded-2xl border overflow-hidden"
        style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-card)" }}
      >
        {/* Cabeçalho do bilhete */}
        <div className="p-6 pb-4 text-center" style={{ backgroundColor: "var(--bg-primary)" }}>
          {ticket.event.coverImage ? (
            <div className="w-full h-36 rounded-xl overflow-hidden mb-4">
              <SmartImage
                src={ticket.event.coverImage}
                alt={ticket.event.title}
                width={448}
                height={144}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-36 rounded-xl mb-4 flex items-center justify-center" style={{ backgroundColor: "var(--bg-secondary)" }}>
              <Ticket className="w-10 h-10" style={{ color: "var(--text-muted)" }} />
            </div>
          )}
          <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>{ticket.event.title}</h2>
          {ticket.event.venue && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{ticket.event.venue}</p>
          )}
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {formatDateTime(ticket.event.startDate)}
          </p>
        </div>

        {/* Linha de perfuração */}
        <div className="px-5">
          <div className="border-t border-dashed" style={{ borderColor: "var(--border-color)" }} />
        </div>

        {/* Corpo do bilhete */}
        <div className="p-6 pt-5">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {ticket.ticketTypeName || "Tipo de bilhete"}
            </p>
            {ticket.ticketTypeKind && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {TICKET_KIND_LABELS[ticket.ticketTypeKind]}
              </p>
            )}
          </div>

          <div className="my-5 text-center">
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Código</p>
            <p
              className="font-mono text-2xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {ticket.code}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm mb-4">
            {ticket.holderName && (
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Nome</span>
                <span style={{ color: "var(--text-primary)" }}>{ticket.holderName}</span>
              </div>
            )}
            {ticket.holderEmail && (
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Email</span>
                <span style={{ color: "var(--text-primary)" }}>{ticket.holderEmail}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span style={{ color: "var(--text-muted)" }}>Preço</span>
              <span style={{ color: "var(--text-primary)" }}>{formatCurrency(ticket.price)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: "var(--text-muted)" }}>Estado</span>
              <span className={`badge ${TICKET_STATUS_BADGES[ticket.status] ?? "badge-neutral"}`}>
                {TICKET_STATUS_LABELS[ticket.status]}
              </span>
            </div>
            {ticket.checkedIn && ticket.checkedInAt && (
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Check-in</span>
                <span style={{ color: "var(--text-primary)" }}>{formatDateTime(ticket.checkedInAt)}</span>
              </div>
            )}
          </div>

          <div
            className="rounded-lg border px-4 py-3 text-center text-sm"
            style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)" }}
          >
            {ticket.status === "VALIDO" && !ticket.checkedIn ? (
              <span style={{ color: "var(--text-muted)" }}>
                Apresente este código na entrada para fazer check-in.
              </span>
            ) : ticket.status === "USADO" || ticket.checkedIn ? (
              <span style={{ color: "var(--text-primary)" }}>
                Este bilhete já foi utilizado.
              </span>
            ) : (
              <span style={{ color: "var(--text-primary)" }}>
                Este bilhete está cancelado.
              </span>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 text-center">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Emitido em {formatDateTime(ticket.issuedAt)} · IBPlus+
          </p>
        </div>
      </div>

      <div className="no-print mx-auto max-w-md mt-6 flex justify-center gap-3">
        <button onClick={() => window.print()} className="btn btn-primary">
          <Printer className="w-4 h-4" />
          Imprimir bilhete
        </button>
        <Link href={`/eventos/${id}`} className="btn btn-ghost">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </div>
    </div>
  );
}
