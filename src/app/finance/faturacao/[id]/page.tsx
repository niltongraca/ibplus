"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileDown, Printer, Trash2, Save, RotateCcw, CheckCircle, Wallet } from "lucide-react";
import Link from "next/link";
import { useConfirm } from "@/components/ConfirmModal";
import { InvoiceTemplate } from "@/components/invoice/InvoiceTemplate";
import { buildDocumentHtml } from "@/lib/exportDocument";
import { formatCurrency } from "@/lib/utils";

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
  customerEmail: string | null;
  customerPhone: string | null;
  customerNif: string | null;
  date: string;
  dueDate: string | null;
  subtotal: number;
  discountType: string;
  discountValue: number;
  discount: number;
  installments: number;
  currency: string;
  paymentMethod: string | null;
  bankDetails: string | null;
  paidAmount: number;
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
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("pending");
  const [paidInput, setPaidInput] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices/${id}`).then(r => r.json()),
      fetch("/api/company").then(r => r.json()).catch(() => ({ company: null })),
    ])
      .then(([d, c]) => {
        setInvoice(d.invoice);
        setCompany(c.company);
        if (d.invoice) {
          setStatus(d.invoice.status);
          setPaidInput(d.invoice.paidAmount || 0);
        }
      })
      .catch(() => router.push("/finance/faturacao"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function saveStatus(next?: string, paid?: number) {
    if (!invoice) return;
    const targetStatus = next ?? status;
    const targetPaid = paid ?? (targetStatus === "paid" ? invoice.total : (targetStatus === "partially_paid" ? paidInput : 0));
    const payable = Math.min(Math.max(0, Number(targetPaid) || 0), targetStatus === "paid" ? invoice.total : invoice.total);
    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          paidAmount: targetStatus === "paid" ? invoice.total : (targetStatus === "partially_paid" ? payable : 0),
          total: invoice.total,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInvoice((prev) => prev ? { ...prev, status: targetStatus, paidAmount: targetStatus === "paid" ? prev.total : (targetStatus === "partially_paid" ? payable : 0) } : null);
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar o estado.");
    } finally {
      setSaving(false);
    }
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
          customerEmail: invoice.customerEmail,
          customerPhone: invoice.customerPhone,
          customerNif: invoice.customerNif,
          date: invoice.date,
          secondaryDateLabel: "Vencimento",
          secondaryDate: invoice.dueDate,
          status: invoice.status,
          notes: invoice.notes,
          items: invoice.items,
          subtotal: invoice.subtotal,
          discountType: invoice.discountType,
          discountValue: invoice.discountValue,
          discount: invoice.discount,
          installments: invoice.installments,
          currency: invoice.currency,
          paymentMethod: invoice.paymentMethod,
          bankDetails: invoice.bankDetails,
          paidAmount: invoice.paidAmount,
          total: invoice.total,
        },
        company
      )
    );
    win.document.close();
  }

  if (loading) return <div className="p-12 text-center text-ib-muted">A carregar...</div>;
  if (!invoice) return null;

  const remaining = Math.max(0, invoice.total - invoice.paidAmount);

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
        <div className="hidden lg:flex items-center gap-2">
          <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-ib-muted hover:bg-gray-50">
            <FileDown className="w-4 h-4" /> Exportar
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-ib-muted hover:bg-gray-50">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          {invoice.status !== "paid" && (
            <button onClick={() => saveStatus("paid")} disabled={saving} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              <CheckCircle className="w-4 h-4" /> Marcar como Paga
            </button>
          )}
          <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Eliminar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 print-hidden">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="sm:w-64">
            <label className="block text-sm font-medium text-ib-primary mb-1">Estado</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40">
              <option value="pending">Espera</option>
              <option value="partially_paid">Parcialmente pago</option>
              <option value="paid">Pago</option>
            </select>
          </div>
          {status === "partially_paid" && (
            <div className="sm:w-64">
              <label className="block text-sm font-medium text-ib-primary mb-1">Valor pago</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={paidInput}
                onChange={(e) => setPaidInput(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
              />
            </div>
          )}
          <button onClick={() => saveStatus()} disabled={saving} className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? "A guardar..." : "Guardar estado"}
          </button>
          {invoice.status !== "pending" && (
            <button onClick={() => { setStatus("pending"); setPaidInput(0); saveStatus("pending", 0); }} className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-ib-muted hover:bg-gray-50">
              <RotateCcw className="w-4 h-4" /> Marcar como espera
            </button>
          )}
        </div>
        {invoice.paidAmount > 0 && (
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-sm">
            <span className="flex items-center gap-1.5 text-green-600 font-medium">
              <Wallet className="w-4 h-4" /> Pago: {formatCurrency(invoice.paidAmount, invoice.currency)}
            </span>
            <span className="text-red-500 font-medium">Em dívida: {formatCurrency(remaining, invoice.currency)}</span>
            <span className="text-ib-muted">Moeda: {invoice.currency}</span>
          </div>
        )}
      </div>

      <InvoiceTemplate
        data={{
          number: invoice.number,
          customer: invoice.customer,
          customerEmail: invoice.customerEmail,
          customerPhone: invoice.customerPhone,
          customerNif: invoice.customerNif,
          date: invoice.date,
          dueDate: invoice.dueDate,
          subtotal: invoice.subtotal,
          discountType: invoice.discountType,
          discountValue: invoice.discountValue,
          discount: invoice.discount,
          installments: invoice.installments,
          currency: invoice.currency,
          paymentMethod: invoice.paymentMethod,
          bankDetails: invoice.bankDetails,
          paidAmount: invoice.paidAmount,
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