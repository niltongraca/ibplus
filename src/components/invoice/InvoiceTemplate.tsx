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
  date: string;
  dueDate?: string | null;
  validUntil?: string | null;
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
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  paid: "Paga",
  approved: "Aprovado",
  overdue: "Vencida",
  cancelled: "Cancelada",
  rejected: "Rejeitado",
  converted: "Convertido",
};

export function InvoiceTemplate({ data, type, typeLabel, company }: InvoiceTemplateProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden print:border-none">
      <div className="bg-gradient-to-r from-[#0a1628] via-[#0f1f3d] to-[#1a2a4a] px-8 py-6 print:px-6 print:py-4">
        <div className="flex justify-between items-start">
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
            {!company && (
              <p className="text-xs text-blue-300/70 mt-0.5">Plataforma de Gestão Empresarial</p>
            )}
          </div>
          <div className="text-right">
            <h3 className="text-3xl font-bold text-white tracking-wider">{type}</h3>
            <p className="text-sm text-blue-300/80 mt-1 font-mono">{data.number}</p>
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
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Cliente</p>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-gray-900">{data.customer || "—"}</p>
              <p>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium border ${statusStyles[data.status] || "bg-gray-100 text-gray-600"}`}>
                  {statusLabels[data.status] || data.status}
                </span>
              </p>
            </div>
          </div>
        </div>

        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="bg-gradient-to-r from-[#0a1628] via-[#0f1f3d] to-[#1a2a4a] text-white">
              <th className="text-left p-3 font-medium text-xs uppercase tracking-wider">Descrição</th>
              <th className="text-center p-3 font-medium text-xs uppercase tracking-wider w-20">Qtd</th>
              <th className="text-right p-3 font-medium text-xs uppercase tracking-wider w-32">Preço Unit.</th>
              <th className="text-right p-3 font-medium text-xs uppercase tracking-wider w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={item.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                <td className="p-3 text-gray-900 border-b border-gray-100">{item.description}</td>
                <td className="p-3 text-center text-gray-700 border-b border-gray-100">{item.quantity}</td>
                <td className="p-3 text-right text-gray-700 border-b border-gray-100">{formatCurrency(item.unitPrice)}</td>
                <td className="p-3 text-right font-medium text-gray-900 border-b border-gray-100">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-6">
          <div className="w-64 bg-gradient-to-br from-[#0a1628] to-[#1a2a4a] rounded-lg p-4 text-white">
            <p className="text-xs text-blue-300/80 uppercase tracking-wider mb-1">Total {typeLabel}</p>
            <p className="text-2xl font-bold">{formatCurrency(data.total)}</p>
          </div>
        </div>

        {data.notes && (
          <div className="border-t border-gray-100 pt-4 mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Observações</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4 mt-6 flex justify-between items-center text-xs text-gray-400">
          <span>Documento gerado por {company?.name || "IBPlus+"}</span>
          <span>{type} {data.number}</span>
        </div>
      </div>
    </div>
  );
}
