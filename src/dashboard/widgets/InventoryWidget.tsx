"use client";

import { Warehouse, ArrowRight, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  minStock: number;
}

interface InventoryData {
  totalProducts: number;
  productsLowStock: number;
  lowStockProducts: LowStockProduct[];
  totalRevenue: number;
}

export function InventoryWidget({ data }: { data: InventoryData | null }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Warehouse className="w-5 h-5 text-amber-600" />
          <h2 className="font-semibold text-ib-primary">Stock</h2>
        </div>
        <Link href="/gestao/stock" className="text-xs text-ib-accent hover:text-blue-700 font-medium flex items-center gap-1">
          Gerir <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-blue-600">{data.totalProducts}</p>
          <p className="text-xs text-blue-500">Produtos</p>
        </div>
        <div className={`rounded-lg p-3 text-center ${data.productsLowStock > 0 ? "bg-red-50" : "bg-green-50"}`}>
          <p className={`text-lg font-bold ${data.productsLowStock > 0 ? "text-red-600" : "text-green-600"}`}>
            {data.productsLowStock}
          </p>
          <p className="text-xs">Stock Crítico</p>
        </div>
      </div>
      {data.lowStockProducts?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ib-muted uppercase tracking-wider mb-2">Produtos críticos</p>
          <div className="space-y-1.5">
            {data.lowStockProducts.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="text-ib-primary truncate">{p.name}</span>
                <span className="ml-auto text-red-500 font-medium">{p.stock}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
