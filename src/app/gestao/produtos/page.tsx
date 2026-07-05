"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit3, Trash2, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";
import { useToast } from "@/components/Toast";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  active: boolean;
  category: { name: string } | null;
}

export default function ProdutosPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Eliminar produto?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Produto eliminado com sucesso!");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } else {
      toast("Erro ao eliminar produto.", "error");
    }
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Produtos</h1>
          <p className="text-ib-muted text-sm">Gerir catálogo de produtos e serviços</p>
        </div>
        <Link
          href="/gestao/produtos/novo"
          className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Novo Produto
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>
        </div>

        <DataTable
          columns={[
            { key: "name", header: "Produto", render: (p) => (
              <div>
                <Link href={`/gestao/produtos/${p.id}`} className="font-medium text-ib-primary hover:text-ib-accent">
                  {p.name}
                </Link>
                {p.description && <p className="text-xs text-ib-muted mt-0.5">{p.description}</p>}
              </div>
            )},
            { key: "category", header: "Categoria", hide: "tablet", render: (p) => <span className="text-ib-muted">{p.category?.name || "—"}</span> },
            { key: "price", header: "Preço", className: "text-right", render: (p) => <span className="font-semibold">{formatCurrency(p.price)}</span> },
            { key: "cost", header: "Custo", hide: "tablet", className: "text-right", render: (p) => <span className="text-ib-muted">{formatCurrency(p.cost)}</span> },
            { key: "stock", header: "Stock", className: "text-right", render: (p) => <span className={`font-medium ${p.stock <= 0 ? "text-red-500" : "text-ib-primary"}`}>{p.stock} {p.unit}</span> },
            { key: "status", header: "Estado", hide: "mobile", className: "text-center", render: (p) => (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                {p.active ? "Activo" : "Inactivo"}
              </span>
            )},
            { key: "actions", header: "Acções", hide: "mobile", className: "text-right", render: (p) => (
              <div className="flex items-center justify-end gap-1">
                <Link href={`/gestao/produtos/${p.id}/editar`} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit3 className="w-4 h-4 text-ib-muted" /></Link>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
              </div>
            )},
          ]}
          data={filtered}
          loading={loading}
          emptyIcon={<Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhum produto encontrado."
          keyExtractor={(p) => p.id}
          mobileCard={(p) => (
            <Link href={`/gestao/produtos/${p.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-ib-primary">{p.name}</p>
                  {p.category?.name && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">{p.category.name}</span>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                  {p.active ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-ib-primary">{formatCurrency(p.price)}</span>
                <span className={`font-medium ${p.stock <= 0 ? "text-red-500" : "text-ib-muted"}`}>{p.stock} {p.unit}</span>
              </div>
            </Link>
          )}
        />
      </div>
    </div>
  );
}
