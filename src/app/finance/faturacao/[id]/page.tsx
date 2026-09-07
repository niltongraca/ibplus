"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileDown, Printer, Trash2, Send, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useConfirm } from "@/components/ConfirmModal";
import { InvoiceTemplate } from "@/components/invoice/InvoiceTemplate";
import { buildDocumentHtml } from "@/lib/exportDocument";

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
  const { confirm } = useConfirm();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [company, setCompany] = useState<{ name: string; nif?: string | null; email?: string | null; phone?: string | null; address?: string | null; logo?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices/${id}`).then(r => r.json()),
      fetch("/api/company").then(r => r.json()).catch(() => ({ company: null })),
    ])
      .then(([d, c]) => {
        setInvoice(d.invoice);
        setCompany(c.company);
      })
      .catch(() => router.push("/finance/faturacao"))
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
    if (!(await confirm({ title: "Eliminar fatura", message: "Tem a certeza que deseja eliminar esta fatura?", variant: "danger" }))) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    router.push("/finance/faturacao");
  }

  function handleExportPDF() {
    const win = window.open("", "_blank");
    if (!win || !invoice) return;
    win.document.write(
      buildDocumentHtml(
        {
          type: "FATURA",
          typeLabel: "da Factura",
          number: invoice.number,
          customer: invoice.customer,
          date: invoice.date,
          secondaryDateLabel: "Vencimento",
          secondaryDate: invoice.dueDate,
          status: invoice.status,
          notes: invoice.notes,
          items: invoice.items,
          total: invoice.total,
        },
        company
      )
    );
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
              <Send className="w-4 h-4" /> Marcar como Enviada
            </button>
          )}
          {invoice.status === "sent" && (
            <button onClick={() => updateStatus("paid")} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              <CheckCircle className="w-4 h-4" /> Marcar como Paga
            </button>
          )}
          <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Eliminar
          </button>
        </div>
      </div>

      <InvoiceTemplate
        data={{
          number: invoice.number,
          customer: invoice.customer,
          date: invoice.date,
          dueDate: invoice.dueDate,
          total: invoice.total,
          status: invoice.status,
          notes: invoice.notes,
          items: invoice.items,
        }}
        type="FATURA"
        typeLabel="da Factura"
        company={company}
      />
    </div>
  );
}
