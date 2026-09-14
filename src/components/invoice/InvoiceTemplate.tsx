"use client";

import { formatCurrency, formatDate } from "@/lib/utils";

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  number: string;
  customer: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerNif?: string | null;
  date: string;
  dueDate?: string | null;
  validUntil?: string | null;
  subtotal?: number;
  discountType?: string;
  discountValue?: number;
  discount?: number;
  installments?: number;
  currency?: string;
  paymentMethod?: string | null;
  bankDetails?: string | null;
  paidAmount?: number;
  total: number;
  status: string;
  notes?: string | null;
  items: LineItem[];
}

export interface CompanyInfo {
  name: string;
  nif?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logo?: string | null;
}

interface InvoiceTemplateProps {
  data: InvoiceData;
  type: "FATURA" | "ORÇAMENTO";
  typeLabel: string;
  company?: CompanyInfo | null;
}

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-400 border-gray-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  converted: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  partially_paid: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  paid: "Pago",
  approved: "Aprovado",
  overdue: "Vencida",
  cancelled: "Cancelada",
  rejected: "Rejeitado",
  converted: "Convertido",
  pending: "Espera",
  partially_paid: "Parcialmente Pago",
};

export function InvoiceTemplate({ data, type, typeLabel, company }: InvoiceTemplateProps) {
  const currency = data.currency || "AOA";
  const subtotal = data.subtotal ?? data.total;
  const discount = data.discount ?? 0;
  const installments = data.installments ?? 1;
  const paidAmount = data.paidAmount ?? 0;
  const remaining = Math.max(0, data.total - paidAmount);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden print:border-none">
      <div className="bg-gradient-to-r from-[#0a1628] via-[#0f1f3d] to-[#1a2a4a] px-8 py-6 print:px-6 print:py-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            {company?.logo && (
              <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-white p-1.5 shrink-0">
                <img src={company.logo} alt={`${company?.name || "Empresa"} logo`} className="w-full h-full object-contain" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{company?.name || "IBPlus+"}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                {company?.nif && (
                  <p className="text-xs text-blue-300/70">NIF: {company.nif}</p>
                )}
                {company?.email && (
                  <p className="text-xs text-blue-300/70">{company.email}</p>
                )}
                {company?.phone && (
                  <p className="text-xs text-blue-300/70">{company.phone}</p>
                )}
              </div>
              {company?.address && (
                <p className="text-xs text-blue-300/50 mt-0.5">{company.address}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-3xl font-bold text-white tracking-wider">{type}</h3>
            <p className="text-sm text-blue-300/80 mt-1 font-mono">{data.number}</p>
            <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold border mt-3 ${statusStyles[data.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
              {statusLabels[data.status] || data.status}
            </span>
          </div>
        </div>
      </div>

      <div className="p-8 print:p-6">
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Datas</p>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-500">Emissão:</span> <span className="font-medium text-gray-900">{formatDate(data.date)}</span></p>
              {data.dueDate !== undefined && (
                <p><span className="text-gray-500">Vencimento:</span> <span className="font-medium text-gray-900">{data.dueDate ? formatDate(data.dueDate) : "—"}</span></p>
              )}
              {data.validUntil !== undefined && (
                <p><span className="text-gray-500">Validade:</span> <span className="font-medium text-gray-900">{data.validUntil ? formatDate(data.validUntil) : "—"}</span></p>
              )}
              {data.paymentMethod && (
                <p><span className="text-gray-500">Pagamento:</span> <span className="font-medium text-gray-900 capitalize">{data.paymentMethod}</span></p>
              )}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Cliente</p>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-gray-900 break-words">{data.customer || "—"}</p>
              {data.customerPhone && <p className="text-gray-600">{data.customerPhone}</p>}
              {data.customerEmail && <p className="text-gray-600 break-all">{data.customerEmail}</p>}
              {data.customerNif && <p className="text-gray-600">NIF: {data.customerNif}</p>}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 overflow-x-auto mb-8">
          <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="bg-gradient-to-r from-[#0a1628] via-[#0f1f3d] to-[#1a2a4a] text-white">
              <th className="text-left p-3 font-medium text-xs uppercase tracking-wider">Descrição</th>
              <th className="text-center p-3 font-medium text-xs uppercase tracking-wider w-16">Qtd</th>
              <th className="text-right p-3 font-medium text-xs uppercase tracking-wider w-32">Preço Unit.</th>
              <th className="text-right p-3 font-medium text-xs uppercase tracking-wider w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400">Sem itens registados.</td>
              </tr>
            ) : (
              data.items.map((item, idx) => (
                <tr key={item.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="p-3 text-gray-900 border-b border-gray-100">{item.description}</td>
                  <td className="p-3 text-center text-gray-700 border-b border-gray-100 whitespace-nowrap">{item.quantity}</td>
                  <td className="p-3 text-right text-gray-700 border-b border-gray-100 whitespace-nowrap">{formatCurrency(item.unitPrice, currency)}</td>
                  <td className="p-3 text-right font-medium text-gray-900 border-b border-gray-100 whitespace-nowrap">{formatCurrency(item.total, currency)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-6 mb-6">
          <div className="w-full sm:w-72">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrency(subtotal, currency)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Desconto
                    {data.discountType === "percentage" && data.discountValue ? ` (${data.discountValue}%)` : ""}
                  </span>
                  <span className="font-medium text-red-500">- {formatCurrency(discount, currency)}</span>
                </div>
              )}
              {installments > 1 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Prestações</span>
                  <span className="font-medium text-gray-900">{installments} × {formatCurrency(data.total / installments, currency)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 flex justify-between text-base">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">{formatCurrency(data.total, currency)}</span>
              </div>
              {type === "FATURA" && paidAmount > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pago</span>
                    <span className="font-medium text-green-600">{formatCurrency(paidAmount, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Em dívida</span>
                    <span className="font-semibold text-red-500">{formatCurrency(remaining, currency)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="w-full sm:w-64 bg-gradient-to-br from-[#0a1628] to-[#1a2a4a] rounded-xl p-5 text-white">
            <p className="text-xs text-blue-300/80 uppercase tracking-wider mb-1">Total {typeLabel}</p>
            <p className="text-2xl font-bold tracking-tight">{formatCurrency(data.total, currency)}</p>
          </div>
        </div>

        {data.bankDetails && (
          <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-4 mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Coordenadas bancárias</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.bankDetails}</p>
          </div>
        )}

        {data.notes && (
          <div className="border-t border-gray-100 pt-4 mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Observações</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4 mt-6 flex justify-between items-center text-xs text-gray-400">
          <span>Documento gerado na plataforma IBPlus+</span>
          <span>{type} {data.number}</span>
        </div>
      </div>
    </div>
  );
}