"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Package, Wrench } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  mode: "create" | "edit";
  type: "product" | "service";
  id?: string;
  initialData?: {
    name: string;
    description: string | null;
    price: number;
    cost?: number;
    stock?: number;
    minStock?: number;
    unit?: string;
    categoryId?: string | null;
    duration?: string | null;
  };
}

const COMMERCE_TYPES = ["EMPRESA", "EMPREENDEDOR", "COOPERATIVA"];

export default function ProductForm({ mode, type, id, initialData }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  const isCommerce = user?.accountType ? COMMERCE_TYPES.includes(user.accountType) : false;

  const [form, setForm] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price ? String(initialData.price) : "",
    cost: initialData && "cost" in (initialData || {}) ? String((initialData as any).cost || "") : "",
    stock: initialData && "stock" in (initialData || {}) ? String((initialData as any).stock || "0") : "",
    minStock: initialData && "minStock" in (initialData || {}) ? String((initialData as any).minStock || "0") : "",
    unit: initialData?.unit || "un",
    categoryId: initialData?.categoryId || "",
    duration: initialData?.duration || "",
  });

  useEffect(() => {
    if (type === "product") {
      fetch("/api/categories")
        .then((r) => r.json())
        .then((d) => setCategories(d.categories || []))
        .catch(() => {});
    }
  }, [type]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const body: Record<string, any> = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
    };

    if (type === "product") {
      body.cost = parseFloat(form.cost) || 0;
      body.stock = parseInt(form.stock) || 0;
      body.minStock = parseInt(form.minStock) || 0;
      body.unit = form.unit;
      body.categoryId = form.categoryId || null;
    } else {
      body.duration = form.duration || null;
    }

    try {
      const endpoint = type === "product"
        ? (mode === "create" ? "/api/products" : `/api/products/${id}`)
        : (mode === "create" ? "/api/services" : `/api/services/${id}`);

      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const msg = type === "product" ? "Produto" : "Serviço";
        toast(`${msg} ${mode === "create" ? "criado" : "actualizado"} com sucesso!`);
        router.push(type === "product" ? "/gestao/produtos" : "/gestao/servicos");
      } else {
        toast("Erro ao guardar.", "error");
      }
    } catch {
      toast("Erro ao guardar.", "error");
    } finally {
      setSaving(false);
    }
  }

  const title = mode === "create" ? "Novo" : "Editar";
  const itemLabel = type === "product" ? "Produto" : "Serviço";
  const backHref = mode === "create"
    ? (type === "product" ? "/gestao/produtos" : "/gestao/servicos")
    : (type === "product" ? `/gestao/produtos/${id}` : `/gestao/servicos/${id}`);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={backHref} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-ib-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ib-primary flex items-center gap-2">
            {type === "product" ? <Package className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
            {title} {itemLabel}
          </h1>
          <p className="text-ib-muted text-sm">
            {type === "product" ? "Adicionar ou editar produto do catálogo" : "Adicionar ou editar serviço"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-ib-primary mb-1">Nome *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-ib-primary mb-1">Descrição</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Preço *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>

          {type === "service" && (
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Duração</label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="ex.: 1h, 2 dias, mensal"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
              />
            </div>
          )}

          {type === "product" && isCommerce && (
            <>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Custo</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Stock</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Stock Mínimo</label>
                <input
                  type="number"
                  min="0"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Unidade</label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Categoria</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
                >
                  <option value="">Sem categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "A guardar..." : mode === "create" ? "Criar" : "Guardar Alterações"}
          </button>
          <Link
            href={backHref}
            className="text-sm text-ib-muted hover:text-ib-primary px-4 py-2.5"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
