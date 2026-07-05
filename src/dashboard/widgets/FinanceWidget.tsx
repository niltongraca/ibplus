"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface FinanceData {
  totalRevenue: number;
  pendingInvoices: number;
  pendingInvoicesTotal: number;
  totalProducts: number;
}

export function FinanceWidget({ data }: { data: FinanceData | null }) {
  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-ib-muted py-8 text-center">Sem dados disponíveis.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-ib-primary">Resumo Financeiro</h2>
        <Link href="/finance/relatorios" className="text-xs text-ib-accent hover:text-blue-700 font-medium flex items-center gap-1">
          Relatórios <TrendingUp className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm text-ib-muted">Receita</span>
          </div>
          <span className="text-sm font-semibold text-green-600">{formatCurrency(data.totalRevenue)}</span>
        </div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-sm text-ib-muted">Faturas Pendentes</span>
          </div>
          <span className="text-sm font-semibold text-red-500">{data.pendingInvoices} ({formatCurrency(data.pendingInvoicesTotal)})</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-medium text-ib-primary">Produtos em Stock</span>
          <span className="text-sm font-bold text-ib-primary">{data.totalProducts}</span>
        </div>
      </div>
    </div>
  );
}
