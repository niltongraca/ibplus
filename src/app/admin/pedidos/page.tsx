"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  ArrowUpRight,
  Building2,
  Calendar,
  Check,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  X,
} from "lucide-react";
import Pagination from "@/components/Pagination";
import { useList } from "@/hooks/useList";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import { apiFetch } from "@/lib/api";

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

interface UpgradeRequestRow {
  id: string;
  fromPlan: string;
  toPlan: string;
  status: RequestStatus;
  phone: string | null;
  note: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  company: { id: string; name: string } | null;
}

const statusStyles: Record<RequestStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

const statusLabels: Record<RequestStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
};

const planStyles: Record<string, string> = {
  FREE: "bg-gray-50 text-gray-600 border-gray-200",
  PREMIUM: "bg-amber-50 text-amber-700 border-amber-200",
  BUSINESS: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function AdminPedidos() {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [status, setStatus] = useState<"" | RequestStatus>("PENDING");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, total, page, setPage, totalPages, refetch } = useList<UpgradeRequestRow>(
    "/api/admin/upgrade-requests",
    "requests",
    { limit: 20, params: { status } }
  );

  async function review(request: UpgradeRequestRow, decision: "APPROVED" | "REJECTED") {
    const accepted = await confirm({
      title: decision === "APPROVED" ? "Aprovar upgrade?" : "Rejeitar pedido?",
      message:
        decision === "APPROVED"
          ? `O plano de ${request.company?.name ?? request.user.name} passará para ${request.toPlan}.`
          : `O pedido de ${request.company?.name ?? request.user.name} para ${request.toPlan} será rejeitado.`,
      confirmLabel: decision === "APPROVED" ? "Aprovar" : "Rejeitar",
      variant: decision === "APPROVED" ? "info" : "danger",
    });
    if (!accepted) return;

    setBusyId(request.id);
    try {
      await apiFetch(`/api/admin/upgrade-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: decision }),
      });
      toast(
        decision === "APPROVED" ? "Upgrade aprovado." : "Pedido rejeitado.",
        "success"
      );
      refetch();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível analisar o pedido.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <ArrowUpRight className="w-6 h-6 text-ib-accent" />
          <div>
            <h1 className="page-title">Pedidos de Upgrade</h1>
            <p className="text-sm text-ib-muted">Analise e active os novos planos solicitados</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="upgrade-status" className="text-xs text-ib-muted">
            Estado
          </label>
          <select
            id="upgrade-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as "" | RequestStatus);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
          >
            <option value="PENDING">Pendentes</option>
            <option value="APPROVED">Aprovados</option>
            <option value="REJECTED">Rejeitados</option>
            <option value="">Todos</option>
          </select>
          <span className="text-xs text-ib-muted">{total} pedido{total !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-ib-muted text-left">
                <th className="tbl-th">Requerente</th>
                <th className="tbl-th">Empresa</th>
                <th className="tbl-th">Upgrade</th>
                <th className="tbl-th">Contacto</th>
                <th className="tbl-th">Data</th>
                <th className="tbl-th"> Estado</th>
                <th className="tbl-th">Acções</th>
              </tr>
            </thead>
            <tbody>
              {data.map((request) => {
                const busy = busyId === request.id;
                return (
                  <tr
                    key={request.id}
                    className="border-b border-gray-50 text-ib-primary hover:bg-gray-50 transition-colors"
                  >
                    <td className="tbl-td">
                      <div className="font-medium">{request.user.name}</div>
                      <div className="text-xs text-ib-muted flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {request.user.email}
                      </div>
                    </td>
                    <td className="tbl-td">
                      {request.company ? (
                        <span className="text-sm flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-ib-muted" />
                          {request.company.name}
                        </span>
                      ) : (
                        <span className="text-ib-muted text-sm">—</span>
                      )}
                    </td>
                    <td className="tbl-td">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${planStyles[request.fromPlan] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                          {request.fromPlan}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-ib-accent" />
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${planStyles[request.toPlan] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                          {request.toPlan}
                        </span>
                      </div>
                      {request.note && (
                        <div className="text-xs text-ib-muted flex items-start gap-1 mt-1 max-w-[220px]" title={request.note}>
                          <MessageSquare className="w-3 h-3 shrink-0 mt-0.5" />
                          <span className="truncate">{request.note}</span>
                        </div>
                      )}
                    </td>
                    <td className="tbl-td text-ib-muted text-sm">
                      {request.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3" /> {request.phone}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="tbl-td text-ib-muted text-sm">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(request.createdAt).toLocaleDateString("pt-AO")}
                      </span>
                    </td>
                    <td className="tbl-td">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[request.status]}`}>
                        {statusLabels[request.status]}
                      </span>
                      {request.reviewedAt && (
                        <div className="text-[10px] text-ib-muted mt-1">
                          {new Date(request.reviewedAt).toLocaleDateString("pt-AO")}
                        </div>
                      )}
                    </td>
                    <td className="tbl-td">
                      {request.status === "PENDING" ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => review(request, "APPROVED")}
                            disabled={busy}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg disabled:opacity-50"
                          >
                            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Aprovar
                          </button>
                          <button
                            onClick={() => review(request, "REJECTED")}
                            disabled={busy}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" /> Rejeitar
                          </button>
                        </div>
                      ) : (
                        <span className="text-ib-muted text-xs">Analisado</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-ib-muted">
                    <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </AdminLayout>
  );
}
