"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileDown, Printer, Send, Trash2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useConfirm } from "@/components/ConfirmModal";
import { InvoiceTemplate } from "@/components/invoice/InvoiceTemplate";

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Quote {
  id: string;
  number: string;
  customer: string | null;
  date: string;
  validUntil: string | null;
  total: number;
  status: string;
  notes: string | null;
  items: QuoteItem[];
}

export default function OrcamentoDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();
  const { confirm } = useConfirm();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [company, setCompany] = useState<{ name: string; nif?: string | null; email?: string | null; phone?: string | null; address?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/quotes/${id}`).then(r => r.json()),
      fetch("/api/company").then(r => r.json()).catch(() => ({ company: null })),
    ])
      .then(([d, c]) => {
        setQuote(d.quote);
        setCompany(c.company);
      })
      .catch(() => router.push("/finance/orcamentos"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function updateStatus(status: string) {
    await fetch(`/api/quotes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setQuote((prev) => prev ? { ...prev, status } : null);
  }

  async function handleDelete() {
    if (!(await confirm({ title: "Eliminar orçamento", message: "Tem a certeza que deseja eliminar este orçamento?", variant: "danger" }))) return;
    await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    router.push("/finance/orcamentos");
  }

  function handleExportPDF() {
    const win = window.open("", "_blank");
    if (!win || !quote) return;
    const itemsRows = quote.items.map(
      (i) => `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.description}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${i.unitPrice.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${i.total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz</td></tr>`
    ).join("");
    const statusLabel: Record<string, string> = { draft: "Rascunho", sent: "Enviado", approved: "Aprovado", rejected: "Rejeitado", converted: "Convertido" };
    win.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Orçamento ${quote.number}</title>
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
        <div class="header"><div class="logo">IBPlus+</div><div class="title">ORÇAMENTO</div></div>
        <div class="info">
          <div><strong>N.º:</strong> ${quote.number}<br><strong>Data:</strong> ${quote.date}<br><strong>Validade:</strong> ${quote.validUntil || "—"}</div>
          <div style="text-align:right"><strong>Cliente:</strong> ${quote.customer || "—"}<br><strong>Estado:</strong> ${statusLabel[quote.status] || quote.status}</div>
        </div>
        <table><thead><tr><th>Descrição</th><th style="text-align:center">Qtd</th><th style="text-align:right">Preço Unit.</th><th style="text-align:right">Total</th></tr></thead><tbody>${itemsRows}</tbody></table>
        <div class="total">Total: ${quote.total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz</div>
        ${quote.notes ? `<p style="font-size:13px;color:#666;margin-bottom:30px"><strong>Observações:</strong> ${quote.notes}</p>` : ""}
        <div class="footer">Documento gerado pelo IBPlus+ — Plataforma de Gestão Empresarial</div>
        <script>window.print();<\/script>
      </body></html>
    `);
    win.document.close();
  }

  if (loading) return <div className="p-12 text-center text-ib-muted">A carregar...</div>;
  if (!quote) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print-hidden">
        <div className="flex items-center gap-4">
          <Link href="/finance/orcamentos" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-ib-muted" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ib-primary">Orçamento {quote.number}</h1>
            <p className="text-ib-muted text-sm">Detalhes do orçamento</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-ib-muted hover:bg-gray-50">
            <FileDown className="w-4 h-4" /> Exportar
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-ib-muted hover:bg-gray-50">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          {quote.status === "draft" && (
            <button onClick={() => updateStatus("sent")} className="flex items-center gap-1.5 px-3 py-2 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <Send className="w-4 h-4" /> Marcar como Enviado
            </button>
          )}
          {quote.status === "sent" && (
            <>
              <button onClick={() => updateStatus("approved")} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                <CheckCircle className="w-4 h-4" /> Aprovar
              </button>
              <button onClick={() => updateStatus("rejected")} className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50">
                <XCircle className="w-4 h-4" /> Rejeitar
              </button>
            </>
          )}
          <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Eliminar
          </button>
        </div>
      </div>

      <InvoiceTemplate
        data={{
          number: quote.number,
          customer: quote.customer,
          date: quote.date,
          validUntil: quote.validUntil,
          total: quote.total,
          status: quote.status,
          notes: quote.notes,
          items: quote.items,
        }}
        type="ORÇAMENTO"
        typeLabel="do Orçamento"
        company={company}
      />
    </div>
  );
}
