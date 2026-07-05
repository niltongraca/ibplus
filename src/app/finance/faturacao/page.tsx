"use client";

import { useState, useEffect } from "react";
import { Plus, Search, FileDown, Eye, Trash2, FileText } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

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
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/invoices")
      .then((r) => r.json())
      .then((d) => setInvoices(d.invoices))
      .catch((err) => console.error("Erro ao carregar faturação:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = invoices.filter((inv) =>
    (inv.number + " " + (inv.customer || "")).toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-600",
      sent: "bg-blue-100 text-blue-700",
      paid: "bg-green-100 text-green-700",
      overdue: "bg-red-100 text-red-700",
      cancelled: "bg-gray-100 text-gray-400",
    };
    const labels: Record<string, string> = {
      draft: "Rascunho",
      sent: "Enviada",
      paid: "Paga",
      overdue: "Vencida",
      cancelled: "Cancelada",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  async function removeInvoice(id: string) {
    if (!confirm("Eliminar fatura?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  }

  function handleExportPDF(inv: Invoice) {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Fatura ${inv.number}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #1a2a4a; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: bold; color: #0056b3; }
        .title { font-size: 28px; font-weight: bold; color: #1a2a4a; }
        .info { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13px; color: #666; }
        .info strong { color: #1a2a4a; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #1a2a4a; color: white; padding: 10px 8px; text-align: left; font-size: 12px; text-transform: uppercase; }
        td { font-size: 13px; padding: 8px; border-bottom: 1px solid #eee; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-bottom: 30px; }
        .footer { font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
      </style>
      </head>
      <body>
        <div class="header"><div class="logo">IBPlus+</div><div class="title">FATURA</div></div>
        <div class="info">
          <div><strong>N.º:</strong> ${inv.number}<br><strong>Data:</strong> ${formatDate(inv.date)}<br><strong>Vencimento:</strong> ${inv.dueDate ? formatDate(inv.dueDate) : "—"}</div>
          <div style="text-align:right"><strong>Cliente:</strong> ${inv.customer || "—"}</div>
        </div>
        <p style="text-align:center;color:#999;padding:40px 0;">Detalhes completos disponíveis na plataforma.</p>
        <div class="total">Total: ${formatCurrency(inv.total)}</div>
        <div class="footer">Documento gerado pelo IBPlus+</div>
        <script>window.print();<\/script>
      </body>
      </html>
    `);
    win.document.close();
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
        ) : filtered.length === 0 ? (
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
                {filtered.map((inv) => (
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
    </div>
  );
}
