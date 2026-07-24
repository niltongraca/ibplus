"use client";

import { Trophy } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { DashboardData } from "../DashboardRenderer";

export function TopProductsWidget({ data }: { data: DashboardData | null }) {
  if (!data || !data.topProducts || data.topProducts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-yellow-500" />
        Top Produtos
      </h3>
      <div className="space-y-3">
        {data.topProducts.map((product, i) => {
          const maxTotal = data.topProducts[0].total;
          const width = maxTotal > 0 ? (product.total / maxTotal) * 100 : 0;

          return (
            <div key={i} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 truncate flex-1 mr-2">{product.name}</span>
                <span className="text-xs text-gray-500">{product.quantity}x</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">{formatCurrency(product.total)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
