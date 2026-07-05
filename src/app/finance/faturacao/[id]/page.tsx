"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileDown, Printer, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  number: string;
  customer: string | null;
  date: string;
  dueDate: string | null;
  total: number;
  status: string;
  notes: string | null;
  items: InvoiceItem[];
}

export default function FaturaDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then((d) => setInvoice(d.invoice))
      .catch((err) => { console.error(err); router.push("/finance/faturacao"); })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function updateStatus(status: string) {
    await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setInvoice((prev) => prev ? { ...prev, status } : null);
  }

  async function handleDelete() {
    if (!confirm("Eliminar fatura?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    router.push("/finance/faturacao");
  }

  function handleExportPDF() {
    const win = window.open("", "_blank");
    if (!win || !invoice) return;
    const itemsRows = invoice.items.map(
      (i) => `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.description}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${i.unitPrice.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${i.total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz</td></tr>`
    ).join("");
    const statusLabel: Record<string, string> = { draft: "Rascunho", sent: "Enviada", paid: "Paga", overdue: "Vencida", cancelled: "Cancelada" };
    win.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Fatura ${invoice.number}</title>
      <style>body{font-family:Arial,sans-serif;margin:40px;color:#1a2a4a;}
        .header{display:flex;justify-content:space-between;margin-bottom:40px;}
        .logo{font-size:24px;font-weight:bold;color:#0056b3;}
        .title{font-size:28px;font-weight:bold;}
        .info{display:flex;justify-content:space-between;margin-bottom:30px;font-size:13px;color:#666;}
        .info strong{color:#1a2a4a;}
        table{width:100%;border-collapse:collapse;margin-bottom:30px;}
        th{background:#1a2a4a;color:white;padding:10px 8px;text-align:left;font-size:12px;text-transform:uppercase;}
        td{font-size:13px;}
        .total{text-align:right;font-size:18px;font-weight:bold;margin-bottom:30px;}
        .footer{font-size:12px;color:#999;border-top:1px solid #eee;padding-top:20px;}
      </style></head>
      <body>
        <div class="header"><div class="logo">IBPlus+</div><div class="title">FATURA</div></div>
        <div class="info">
          <div><strong>N.º:</strong> ${invoice.number}<br><strong>Data:</strong> ${formatDate(invoice.date)}<br><strong>Vencimento:</strong> ${invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</div>
          <div style="text-align:right"><strong>Cliente:</strong> ${invoice.customer || "—"}<br><strong>Estado:</strong> ${statusLabel[invoice.status] || invoice.status}</div>
        </div>
        <table><thead><tr><th>Descrição</th><th style="text-align:center">Qtd</th><th style="text-align:right">Preço Unit.</th><th style="text-align:right">Total</th></tr></thead><tbody>${itemsRows}</tbody></table>
        <div class="total">Total: ${formatCurrency(invoice.total)}</div>
        ${invoice.notes ? `<p style="font-size:13px;color:#666;margin-bottom:30px"><strong>Observações:</strong> ${invoice.notes}</p>` : ""}
        <div class="footer">Documento gerado pelo IBPlus+ — Plataforma de Gestão Empresarial</div>
        <script>window.print();<\/script>
      </body></html>
    `);
    win.document.close();
  }

  if (loading) return <div className="p-12 text-center text-ib-muted">A carregar...</div>;
  if (!invoice) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print-hidden">
        <div className="flex items-center gap-4">
          <Link href="/finance/faturacao" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-ib-muted" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ib-primary">Fatura {invoice.number}</h1>
            <p className="text-ib-muted text-sm">Detalhes da fatura</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-ib-muted hover:bg-gray-50">
            <FileDown className="w-4 h-4" /> Exportar
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-ib-muted hover:bg-gray-50">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          {invoice.status === "draft" && (
            <button onClick={() => updateStatus("sent")} className="flex items-center gap-1.5 px-3 py-2 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <FileDown className="w-4 h-4" /> Marcar como Enviada
            </button>
          )}
          {invoice.status === "sent" && (
            <button onClick={() => updateStatus("paid")} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              <FileDown className="w-4 h-4" /> Marcar como Paga
            </button>
          )}
          <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Eliminar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 print:border-none print:p-0">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-lg font-bold text-ib-primary">IBPlus+</h2>
            <p className="text-sm text-ib-muted">Plataforma de Gestão Empresarial</p>
          </div>
          <div className="text-right">
            <h3 className="text-3xl font-bold text-ib-primary">FATURA</h3>
            <p className="text-sm text-ib-muted">{invoice.number}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 mb-8 text-sm">
          <div className="space-y-1">
            <p><strong className="text-ib-primary">Data:</strong> {formatDate(invoice.date)}</p>
            <p><strong className="text-ib-primary">Vencimento:</strong> {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</p>
          </div>
          <div className="space-y-1 text-right">
            <p><strong className="text-ib-primary">Cliente:</strong> {invoice.customer || "—"}</p>
            <p><strong className="text-ib-primary">Estado:</strong> {invoice.status}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="bg-ib-primary text-white">
              <th className="text-left p-3 font-medium">Descrição</th>
              <th className="text-center p-3 font-medium">Quantidade</th>
              <th className="text-right p-3 font-medium">Preço Unit.</th>
              <th className="text-right p-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="p-3">{item.description}</td>
                <td className="p-3 text-center">{item.quantity}</td>
                <td className="p-3 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="p-3 text-right font-medium">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right mb-6">
          <p className="text-sm text-ib-muted">Total</p>
          <p className="text-3xl font-bold text-ib-primary">{formatCurrency(invoice.total)}</p>
        </div>

        {invoice.notes && (
          <div className="text-sm text-ib-muted border-t border-gray-100 pt-4">
            <strong className="text-ib-primary">Observações:</strong>
            <p className="mt-1">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
