"use client";

import { ArrowRight } from "lucide-react";
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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-ib-primary">Vendas Recentes</h2>
        <Link href="/gestao/vendas" className="text-xs text-ib-accent hover:text-blue-700 font-medium flex items-center gap-1">
          Ver todas <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {sales?.length ? (
        <div className="divide-y divide-gray-100">
          {sales.slice(0, 5).map((sale) => (
            <div key={sale.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-ib-primary">{sale.customer?.name || "Cliente"}</p>
                <p className="text-xs text-ib-muted">{formatDate(sale.date)}</p>
              </div>
              <p className="text-sm font-semibold text-green-600">{formatCurrency(sale.total)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ib-muted py-8 text-center">Nenhuma venda recente.</p>
      )}
    </div>
  );
}
