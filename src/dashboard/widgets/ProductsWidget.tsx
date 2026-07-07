"use client";

import { Package, ArrowRight, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  minStock: number;
}

interface ProductsData {
  totalProducts: number;
  productsLowStock: number;
  lowStockProducts: LowStockProduct[];
}

export function ProductsWidget({ data }: { data: ProductsData | null }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-orange-600" />
          <h2 className="font-semibold text-ib-primary">Produtos</h2>
        </div>
        <Link href="/gestao/produtos" className="text-xs text-ib-accent hover:text-blue-700 font-medium flex items-center gap-1">
          Ver todos ({data.totalProducts}) <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {data.productsLowStock > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-3 p-2.5 bg-red-50 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-600">{data.productsLowStock} produtos com stock baixo</span>
          </div>
          <div className="divide-y divide-gray-100">
            {data.lowStockProducts?.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-ib-primary">{p.name}</span>
                <span className={`text-sm font-medium ${p.stock <= 0 ? "text-red-500" : "text-orange-500"}`}>
                  {p.stock} / {p.minStock}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-ib-muted py-8 text-center">Todos os produtos com stock adequado.</p>
      )}
    </div>
  );
}
