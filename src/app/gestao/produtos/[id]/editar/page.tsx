"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/Toast";

interface Category {
  id: string;
  name: string;
}

export default function EditarProdutoPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    cost: "",
    stock: "",
    minStock: "",
    unit: "un",
    categoryId: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch(`/api/products/${id}`).then((r) => r.json()),
    ])
      .then(([catData, prodData]) => {
        const p = prodData.product;
        setCategories(catData.categories || []);
        setForm({
          name: p.name || "",
          description: p.description || "",
          price: String(p.price || ""),
          cost: String(p.cost || ""),
          stock: String(p.stock || "0"),
          minStock: String(p.minStock || "0"),
          unit: p.unit || "un",
          categoryId: p.categoryId || "",
        });
      })
      .catch((err) => { console.error(err); router.push("/gestao/produtos"); })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          price: parseFloat(form.price),
          cost: parseFloat(form.cost) || 0,
          stock: parseInt(form.stock) || 0,
          minStock: parseInt(form.minStock) || 0,
          unit: form.unit,
          categoryId: form.categoryId || null,
        }),
      });
      if (res.ok) {
        toast("Produto actualizado com sucesso!");
        router.push(`/gestao/produtos/${id}`);
      } else {
        toast("Erro ao actualizar produto.", "error");
      }
    } catch {
      toast("Erro ao actualizar produto.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-ib-muted text-sm">A carregar...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/gestao/produtos/${id}`} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-ib-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Editar Produto</h1>
          <p className="text-ib-muted text-sm">{form.name}</p>
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
        </div>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "A guardar..." : "Guardar Alterações"}
          </button>
          <Link
            href={`/gestao/produtos/${id}`}
            className="text-sm text-ib-muted hover:text-ib-primary px-4 py-2.5"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
