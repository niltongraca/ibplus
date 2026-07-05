"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Warehouse, ArrowDown, ArrowUp } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
  category: { name: string } | null;
  price: number;
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showLow, setShowLow] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  let filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  if (showLow) filtered = filtered.filter((p) => p.stock <= p.minStock);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Stock</h1>
          <p className="text-ib-muted text-sm">Gestão de inventário e movimentos</p>
        </div>
        <Link href="/gestao/stock/movimento" className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Movimento
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-ib-muted uppercase tracking-wider font-medium mb-1">Total Produtos</p>
          <p className="text-2xl font-bold text-ib-primary">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-ib-muted uppercase tracking-wider font-medium mb-1">Stock Total</p>
          <p className="text-2xl font-bold text-ib-primary">{products.reduce((s, p) => s + p.stock, 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-ib-muted uppercase tracking-wider font-medium mb-1">Produtos Críticos</p>
          <p className="text-2xl font-bold text-red-500">{products.filter((p) => p.stock <= p.minStock).length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Pesquisar produtos..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
          <label className="flex items-center gap-2 text-sm text-ib-muted cursor-pointer">
            <input type="checkbox" checked={showLow} onChange={(e) => setShowLow(e.target.checked)} className="rounded border-gray-300 text-ib-accent focus:ring-ib-accent" />
            Só stock crítico
          </label>
        </div>

        <DataTable
          columns={[
            { key: "name", header: "Produto", render: (p) => <span className="font-medium text-ib-primary">{p.name}</span> },
            { key: "category", header: "Categoria", hide: "tablet", render: (p) => <span className="text-ib-muted">{p.category?.name || "—"}</span> },
            { key: "stock", header: "Stock", className: "text-right", render: (p) => <span className="font-semibold">{p.stock} {p.unit}</span> },
            { key: "minStock", header: "Stock Mínimo", hide: "mobile", className: "text-right", render: (p) => <span className="text-ib-muted">{p.minStock}</span> },
            { key: "status", header: "Estado", className: "text-right", render: (p) => {
              const isOut = p.stock <= 0;
              const isLow = p.stock <= p.minStock;
              return isOut ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Sem Stock</span>
              ) : isLow ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Crítico</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Normal</span>
              );
            }},
          ]}
          data={filtered}
          loading={loading}
          emptyIcon={<Warehouse className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhum produto encontrado."
          keyExtractor={(p) => p.id}
          mobileCard={(p) => {
            const isOut = p.stock <= 0;
            const isLow = p.stock <= p.minStock;
            return (
              <div>
                <div className="flex items-start justify-between mb-3">
                  <p className="font-semibold text-ib-primary">{p.name}</p>
                  {isOut ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Sem Stock</span>
                  ) : isLow ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Crítico</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Normal</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ib-muted">{p.category?.name || "—"}</span>
                  <span className="font-semibold">{p.stock} {p.unit}</span>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
