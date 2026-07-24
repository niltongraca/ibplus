"use client";

import { TrendingUp, TrendingDown, Wallet, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface FinanceData {
  totalRevenue: number;
  totalExpenses: number;
  pendingInvoices: number;
  pendingInvoicesTotal: number;
  pendingQuotes: number;
  pendingQuotesTotal: number;
  monthExpenses: number;
}

export function FinanceWidget({ data }: { data: FinanceData | null }) {
  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-400 py-8 text-center">Sem dados financeiros disponíveis.</p>
      </div>
    );
  }

  const netProfit = data.totalRevenue - data.totalExpenses;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-blue-600" />
          Resumo Financeiro
        </h2>
        <Link href="/finance/relatorios" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Ver relatórios</Link>
      </div>
      <div className="space-y-3">
        <FinanceRow icon={TrendingUp} label="Receita" value={formatCurrency(data.totalRevenue)} color="green" />
        <FinanceRow icon={TrendingDown} label="Despesas" value={formatCurrency(data.totalExpenses)} color="red" />
        <FinanceRow icon={Wallet} label="Lucro Líquido" value={formatCurrency(netProfit)} color={netProfit >= 0 ? "green" : "red"} bold />
        <div className="border-t border-gray-100 pt-3 mt-3">
          <FinanceRow icon={FileText} label="Faturas Pendentes" value={`${data.pendingInvoices} — ${formatCurrency(data.pendingInvoicesTotal)}`} color="blue" />
          <FinanceRow icon={FileText} label="Orçamentos Pendentes" value={`${data.pendingQuotes} — ${formatCurrency(data.pendingQuotesTotal)}`} color="purple" />
        </div>
      </div>
    </div>
  );
}

function FinanceRow({ icon: Icon, label, value, color, bold }: {
  icon: any; label: string; value: string; color: string; bold?: boolean;
}) {
  const colors: Record<string, string> = {
    green: "text-green-600",
    red: "text-red-500",
    blue: "text-blue-600",
    purple: "text-purple-600",
  };

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 ${colors[color]}`} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className={`text-sm ${bold ? "font-bold" : "font-semibold"} ${colors[color]}`}>{value}</span>
    </div>
  );
}
