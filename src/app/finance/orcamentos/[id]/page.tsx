"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileDown, Printer, Trash2, CheckCircle, RotateCcw, FileText } from "lucide-react";
import Link from "next/link";
import { useConfirm } from "@/components/ConfirmModal";
import { InvoiceTemplate } from "@/components/invoice/InvoiceTemplate";
import { buildDocumentHtml } from "@/lib/exportDocument";

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
  customerEmail: string | null;
  customerPhone: string | null;
  customerNif: string | null;
  date: string;
  validUntil: string | null;
  subtotal: number;
  discountType: string;
  discountValue: number;
  discount: number;
  installments: number;
  currency: string;
  paymentMethod: string | null;
  bankDetails: string | null;
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
  const [company, setCompany] = useState<{ name: string; nif?: string | null; email?: string | null; phone?: string | null; address?: string | null; logo?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoiceCreated, setInvoiceCreated] = useState(false);

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

  async function changeStatus(status: string) {
    if (!quote || quote.status === status) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuote((prev) => prev ? { ...prev, status } : null);
      if (status === "approved") setInvoiceCreated(true);
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar o estado.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!(await confirm({ title: "Eliminar orçamento", message: "Tem a certeza que deseja eliminar este orçamento?", variant: "danger" }))) return;
    await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    router.push("/finance/orcamentos");
  }

  function handleExportPDF() {
    const win = window.open("", "_blank");
    if (!win || !quote) return;
    win.document.write(
      buildDocumentHtml(
        {
          type: "ORÇAMENTO",
          typeLabel: "do Orçamento",
          number: quote.number,
          customer: quote.customer,
          customerEmail: quote.customerEmail,
          customerPhone: quote.customerPhone,
          customerNif: quote.customerNif,
          date: quote.date,
          secondaryDateLabel: "Validade",
          secondaryDate: quote.validUntil,
          status: quote.status,
          notes: quote.notes,
          items: quote.items,
          subtotal: quote.subtotal,
          discountType: quote.discountType,
          discountValue: quote.discountValue,
          discount: quote.discount,
          installments: quote.installments,
          currency: quote.currency,
          paymentMethod: quote.paymentMethod,
          bankDetails: quote.bankDetails,
          total: quote.total,
        },
        company
      )
    );
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
        <div className="hidden lg:flex items-center gap-2">
          <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-ib-muted hover:bg-gray-50">
            <FileDown className="w-4 h-4" /> Exportar
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-ib-muted hover:bg-gray-50">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          {quote.status !== "approved" && (
            <button onClick={() => changeStatus("approved")} disabled={saving} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              <CheckCircle className="w-4 h-4" /> Aprovar
            </button>
          )}
          {quote.status !== "pending" && (
            <button onClick={() => changeStatus("pending")} disabled={saving} className="flex items-center gap-1.5 px-3 py-2 border border-amber-300 text-amber-700 rounded-lg text-sm hover:bg-amber-50">
              <RotateCcw className="w-4 h-4" /> Em espera
            </button>
          )}
          <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Eliminar
          </button>
        </div>
      </div>

      {quote.status === "approved" && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 mb-6 print-hidden">
          <FileText className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-800">
            {invoiceCreated
              ? "Fatura criada automaticamente a partir deste orçamento."
              : "Este orçamento foi aprovado. A fatura correspondente foi criada na faturação."}
          </p>
          <Link href="/finance/faturacao" className="ml-auto text-sm font-medium text-green-700 hover:underline">Ver faturas</Link>
        </div>
      )}

      {(quote.status === "pending" || quote.status === "approved") && (
        <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 mb-6 print-hidden">
          <span className="text-sm text-ib-muted">
            {quote.status === "pending"
              ? "Este orçamento está em espera. Ao aprová-lo será criada automaticamente uma fatura com os mesmos dados."
              : "Aprovação concluída. A fatura foi criada com os dados deste orçamento."}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => changeStatus("pending")} disabled={saving || quote.status === "pending"} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-ib-muted hover:bg-gray-50 disabled:opacity-50">
              Pôr em espera
            </button>
            <button onClick={() => changeStatus("approved")} disabled={saving || quote.status === "approved"} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              Aprovar e criar fatura
            </button>
          </div>
        </div>
      )}

      <InvoiceTemplate
        data={{
          number: quote.number,
          customer: quote.customer,
          customerEmail: quote.customerEmail,
          customerPhone: quote.customerPhone,
          customerNif: quote.customerNif,
          date: quote.date,
          validUntil: quote.validUntil,
          subtotal: quote.subtotal,
          discountType: quote.discountType,
          discountValue: quote.discountValue,
          discount: quote.discount,
          installments: quote.installments,
          currency: quote.currency,
          paymentMethod: quote.paymentMethod,
          bankDetails: quote.bankDetails,
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