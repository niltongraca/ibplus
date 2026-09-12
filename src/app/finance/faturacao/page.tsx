"use client";

import { useState, useEffect } from "react";
import { Plus, Search, FileDown, Eye, Trash2, FileText, Pencil } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { buildDocumentHtml } from "@/lib/exportDocument";
import { useConfirm } from "@/components/ConfirmModal";
import Link from "next/link";
import Pagination from "@/components/Pagination";
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
          company
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

        {loading ? (
          <div className="p-12 text-center text-ib-muted">A carregar...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-ib-muted">Nenhuma fatura encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-ib-muted text-xs uppercase tracking-wider">
                  <th className="text-left p-4 font-medium">N.º</th>
                  <th className="text-left p-4 font-medium">Cliente</th>
                  <th className="text-left p-4 font-medium">Data</th>
                  <th className="text-left p-4 font-medium">Vencimento</th>
                  <th className="text-right p-4 font-medium">Total</th>
                  <th className="text-center p-4 font-medium">Estado</th>
                  <th className="text-right p-4 font-medium">Acções</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 font-medium text-ib-primary">{inv.number}</td>
                    <td className="p-4 text-ib-muted">{inv.customer || "—"}</td>
                    <td className="p-4 text-ib-muted">{formatDate(inv.date)}</td>
                    <td className="p-4 text-ib-muted">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</td>
                    <td className="p-4 text-right font-semibold">{formatCurrency(inv.total)}</td>
                    <td className="p-4 text-center">{getStatusBadge(inv.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/finance/faturacao/${inv.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-ib-muted" />
                        </Link>
                        <Link href={`/finance/faturacao/${inv.id}/editar`} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4 text-ib-muted" />
                        </Link>
                        <button onClick={() => handleExportPDF(inv)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <FileDown className="w-4 h-4 text-ib-muted" />
                        </button>
                        <button onClick={() => removeInvoice(inv.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
