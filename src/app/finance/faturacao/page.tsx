"use client";

import { useState, useEffect } from "react";
import { Plus, Search, FileDown, Eye, Trash2, FileText, Pencil } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { buildDocumentHtml } from "@/lib/exportDocument";
import { getCspNonce } from "@/lib/cspNonce";
import { useConfirm } from "@/components/ConfirmModal";
import Link from "next/link";
import Pagination from "@/components/Pagination";
import { DataTable } from "@/components/ui/DataTable";
import { useList } from "@/hooks/useList";

interface Invoice {
  id: string;
  number: string;
  customer: string | null;
  date: string;
  dueDate: string | null;
  total: number;
  status: string;
}

export default function FaturacaoPage() {
  const { confirm } = useConfirm();
  const [company, setCompany] = useState<{ name: string; nif?: string | null; email?: string | null; phone?: string | null; address?: string | null; logo?: string | null } | null>(null);
  const [search, setSearch] = useState("");
  const { data: invoices, setData: setInvoices, loading, page, setPage, totalPages } = useList<Invoice>("/api/invoices", "invoices", { limit: 20, params: { search } });

  useEffect(() => {
    fetch("/api/company")
      .then((r) => r.json())
      .then((c) => setCompany(c.company))
      .catch(() => setCompany(null));
  }, []);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700",
      partially_paid: "bg-indigo-100 text-indigo-700",
      paid: "bg-green-100 text-green-700",
      draft: "bg-gray-100 text-gray-600",
      sent: "bg-blue-100 text-blue-700",
      overdue: "bg-red-100 text-red-700",
      cancelled: "bg-gray-100 text-gray-400",
    };
    const labels: Record<string, string> = {
      pending: "Espera",
      partially_paid: "Parcialmente Pago",
      paid: "Pago",
      draft: "Rascunho",
      sent: "Enviada",
      overdue: "Vencida",
      cancelled: "Cancelada",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  async function removeInvoice(id: string) {
    if (!(await confirm({ title: "Eliminar fatura", message: "Tem a certeza que deseja eliminar esta fatura?", variant: "danger" }))) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  }

  async function handleExportPDF(inv: Invoice) {
    try {
      const res = await fetch(`/api/invoices/${inv.id}`);
      const d = await res.json();
      const full = d.invoice;
      const win = window.open("", "_blank");
      if (!win || !full) return;
      win.document.write(
        buildDocumentHtml(
          {
            type: "FATURA",
            typeLabel: "da Factura",
            number: full.number,
            customer: full.customer,
            customerEmail: full.customerEmail,
            customerPhone: full.customerPhone,
            customerNif: full.customerNif,
            date: full.date,
            secondaryDateLabel: "Vencimento",
            secondaryDate: full.dueDate,
            status: full.status,
            notes: full.notes,
            items: full.items || [],
            subtotal: full.subtotal,
            discountType: full.discountType,
            discountValue: full.discountValue,
            discount: full.discount,
            installments: full.installments,
            currency: full.currency,
            paymentMethod: full.paymentMethod,
            bankDetails: full.bankDetails,
            paidAmount: full.paidAmount,
            total: full.total,
          },
          company,
          getCspNonce()
        )
      );
      win.document.close();
    } catch (err) {
      console.error("Erro ao exportar fatura:", err);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Faturação</h1>
          <p className="text-ib-muted text-sm">Gerir facturas e recibos</p>
        </div>
        <Link
          href="/finance/faturacao/nova"
          className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Fatura
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar faturas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>
        </div>

        <DataTable
          columns={[
            { key: "number", header: "N.º", render: (inv: Invoice) => <span className="font-medium text-ib-primary">{inv.number}</span> },
            { key: "customer", header: "Cliente", hide: "mobile", render: (inv: Invoice) => <span className="text-ib-muted">{inv.customer || "—"}</span> },
            { key: "date", header: "Data", hide: "tablet", render: (inv: Invoice) => <span className="text-ib-muted">{formatDate(inv.date)}</span> },
            { key: "dueDate", header: "Vencimento", hide: "tablet", render: (inv: Invoice) => <span className="text-ib-muted">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</span> },
            { key: "total", header: "Total", className: "text-right", render: (inv: Invoice) => <span className="font-semibold">{formatCurrency(inv.total)}</span> },
            { key: "status", header: "Estado", className: "text-center", render: (inv: Invoice) => getStatusBadge(inv.status) },
            { key: "actions", header: "Acções", hide: "tablet", className: "text-right", render: (inv: Invoice) => (
              <div className="flex items-center justify-end gap-1">
                <Link href={`/finance/faturacao/${inv.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Ver">
                  <Eye className="w-4 h-4 text-ib-muted" />
                </Link>
                <Link href={`/finance/faturacao/${inv.id}/editar`} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Editar">
                  <Pencil className="w-4 h-4 text-ib-muted" />
                </Link>
                <button onClick={() => handleExportPDF(inv)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="PDF">
                  <FileDown className="w-4 h-4 text-ib-muted" />
                </button>
                <button onClick={() => removeInvoice(inv.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Eliminar">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            )},
          ]}
          data={invoices}
          loading={loading}
          keyExtractor={(inv: Invoice) => inv.id}
          emptyIcon={<FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhuma fatura encontrada."
          mobileCard={(inv: Invoice) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Link href={`/finance/faturacao/${inv.id}`} className="font-semibold text-ib-primary hover:underline">{inv.number}</Link>
                {getStatusBadge(inv.status)}
              </div>
              <p className="text-sm text-ib-muted">{inv.customer || "—"}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ib-muted">{formatDate(inv.date)}{inv.dueDate ? ` · Venc. ${formatDate(inv.dueDate)}` : ""}</span>
                <span className="font-bold text-ib-primary">{formatCurrency(inv.total)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--border-color)" }}>
                <div className="flex items-center gap-1">
                  <Link href={`/finance/faturacao/${inv.id}/editar`} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center" title="Editar" aria-label={`Editar ${inv.number}`}>
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button onClick={() => handleExportPDF(inv)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center" title="PDF" aria-label={`Baixar PDF da ${inv.number}`}>
                    <FileDown className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={() => removeInvoice(inv.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center" title="Eliminar" aria-label={`Eliminar ${inv.number}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        />
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
