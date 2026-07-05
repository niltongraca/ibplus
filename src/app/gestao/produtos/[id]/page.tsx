"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  active: boolean;
  category: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProdutoDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => setProduct(d.product))
      .catch(() => router.push("/gestao/produtos"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleDelete() {
    if (!confirm("Eliminar produto?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Produto eliminado com sucesso!");
      router.push("/gestao/produtos");
    } else {
      toast("Erro ao eliminar produto.", "error");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-ib-muted text-sm">A carregar...</div>
      </div>
    );
  }

  if (!product) return null;

  const margin = product.price - product.cost;
  const marginPercent = product.price > 0 ? (margin / product.price) * 100 : 0;
  const lowStock = product.stock <= product.minStock;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/gestao/produtos" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-ib-muted" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ib-primary">{product.name}</h1>
            <p className="text-ib-muted text-sm">Detalhes do produto</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/gestao/produtos/${id}/editar`}
            className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-ib-primary px-4 py-2.5 rounded-lg text-sm font-medium"
          >
            <Edit3 className="w-4 h-4" /> Editar
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 border border-red-200 hover:bg-red-50 text-red-600 px-4 py-2.5 rounded-lg text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" /> Eliminar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-ib-primary mb-4">Informação Geral</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Nome</span>
                <span className="text-ib-primary font-medium">{product.name}</span>
              </div>
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Categoria</span>
                <span className="text-ib-primary">{product.category?.name || "—"}</span>
              </div>
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Unidade</span>
                <span className="text-ib-primary">{product.unit}</span>
              </div>
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Estado</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                  {product.active ? "Activo" : "Inactivo"}
                </span>
              </div>
              {product.description && (
                <div className="sm:col-span-2">
                  <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Descrição</span>
                  <span className="text-ib-primary">{product.description}</span>
                </div>
              )}
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Criado em</span>
                <span className="text-ib-muted text-sm">{formatDate(product.createdAt)}</span>
              </div>
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Actualizado em</span>
                <span className="text-ib-muted text-sm">{formatDate(product.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-ib-primary mb-4">Preços</h2>
            <div className="space-y-4">
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Preço de Venda</span>
                <span className="text-2xl font-bold text-ib-primary">{formatCurrency(product.price)}</span>
              </div>
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Custo</span>
                <span className="text-lg font-semibold text-ib-muted">{formatCurrency(product.cost)}</span>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Margem</span>
                <span className={`text-lg font-semibold ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(margin)} ({marginPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-ib-primary mb-4">Stock</h2>
            <div className="space-y-4">
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Stock Actual</span>
                <span className={`text-2xl font-bold ${lowStock ? "text-red-600" : "text-ib-primary"}`}>
                  {product.stock} {product.unit}
                </span>
              </div>
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Stock Mínimo</span>
                <span className="text-lg font-semibold text-ib-muted">{product.minStock} {product.unit}</span>
              </div>
              {lowStock && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  Stock baixo! O stock está igual ou abaixo do mínimo recomendado.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
