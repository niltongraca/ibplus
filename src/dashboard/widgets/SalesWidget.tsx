"use client";

import { ArrowRight, ReceiptText } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

interface Sale {
  id: string;
  total: number;
  date: string;
  customer: { name: string } | null;
}

export function SalesWidget({ sales }: { sales: Sale[] | undefined }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <ReceiptText className="w-4 h-4 text-blue-600" />
          Vendas Recentes
        </h2>
        <Link href="/gestao/vendas" className="text-xs text-ib-accent hover:text-blue-700 font-medium flex items-center gap-1">
          Ver todas <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {sales?.length ? (
        <div className="divide-y divide-gray-100">
          {sales.slice(0, 5).map((sale) => (
            <div key={sale.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition-colors">
              <div className="w-9 h-9 rounded-full bg-blue-100/70 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                {sale.customer?.name?.charAt(0)?.toUpperCase() || "C"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{sale.customer?.name || "Cliente"}</p>
                <p className="text-xs text-ib-muted">{formatDate(sale.date)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(sale.total)}</p>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                  Venda
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ib-muted py-10 text-center">Nenhuma venda recente.</p>
      )}
    </div>
  );
}
