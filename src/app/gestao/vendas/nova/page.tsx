"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  stock: number;
}

interface LineItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export default function NovaVendaPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customerId: "",
    paymentMethod: "cash",
    notes: "",
  });
  const [items, setItems] = useState<LineItem[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ])
      .then(([cData, pData]) => {
        setCustomers(cData.customers || []);
        setProducts(pData.products || []);
      })
      .catch((err) => console.error("Erro ao carregar dados para venda:", err));
  }, []);

  function addItem() {
    setItems([...items, { productId: "", productName: "", quantity: 1, unitPrice: 0 }]);
    setError("");
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
    setError("");
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const newItem = { ...item, [field]: value };
      if (field === "productId") {
        const product = products.find((p) => p.id === value);
        if (product) {
          newItem.productName = product.name;
          newItem.unitPrice = product.price;
          newItem.quantity = 1;
        } else {
          newItem.productName = "";
          newItem.unitPrice = 0;
        }
      }
      if (field === "quantity") newItem.quantity = Number(value);
      if (field === "unitPrice") newItem.unitPrice = Number(value);
      return newItem;
    });
    setItems(updated);
    setError("");
  }

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  function validateItems(): string {
    if (items.length === 0) return "Adiciona pelo menos um item à venda.";
    for (const item of items) {
      if (!item.productId) return "Selecciona o produto em todos os itens.";
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) return "A quantidade deve ser um número inteiro positivo.";
      const product = products.find((p) => p.id === item.productId);
      if (product && item.quantity > product.stock) {
        return `Stock insuficiente para "${product.name}" (disponível: ${product.stock}).`;
      }
    }
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateItems();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: form.customerId || null,
          paymentMethod: form.paymentMethod,
          notes: form.notes || null,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }),
      });
      if (res.ok) {
        router.push("/gestao/vendas");
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error || "Erro ao registar a venda. Tenta novamente.");
    } catch {
      setError("Erro de ligação. Verifica a tua ligação e tenta novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/gestao/vendas" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-ib-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Nova Venda</h1>
          <p className="text-ib-muted text-sm">Registar nova venda</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-ib-primary mb-4">Informações da Venda</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Cliente</label>
              <select
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
              >
                <option value="">Cliente ocasional</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Método de Pagamento</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
              >
                <option value="cash">Numerário</option>
                <option value="card">Cartão</option>
                <option value="transfer">Transferência</option>
                <option value="wallet">Carteira Digital</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-ib-primary mb-1">Notas</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ib-primary">Itens</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 text-sm text-ib-accent hover:text-blue-700 font-medium"
            >
              <Plus className="w-4 h-4" /> Adicionar Item
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-ib-muted text-center py-8">Nenhum item adicionado. Clique em "Adicionar Item" para começar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-3 font-medium text-ib-muted">Produto</th>
                    <th className="text-center pb-3 font-medium text-ib-muted w-24">Qtd</th>
                    <th className="text-right pb-3 font-medium text-ib-muted w-32">Preço Unit.</th>
                    <th className="text-right pb-3 font-medium text-ib-muted w-32">Total</th>
                    <th className="w-10 pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const product = products.find((p) => p.id === item.productId);
                    const stockError = product ? item.quantity > product.stock : false;
                    return (
                      <tr key={index} className="border-b border-gray-50">
                        <td className="py-2 pr-2">
                          <select
                            value={item.productId}
                            onChange={(e) => updateItem(index, "productId", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
                          >
                            <option value="">Seleccionar produto</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (stock: {p.stock})
                              </option>
                            ))}
                          </select>
                          {product && (
                            <p className="mt-1 text-xs text-ib-muted">
                              Stock disponível: <b>{product.stock} {product.unit}</b>
                            </p>
                          )}
                        </td>
                        <td className="py-2 px-1">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", e.target.value)}
                            className={`w-20 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 text-center ${stockError ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                          />
                          {stockError && (
                            <p className="mt-1 text-[11px] text-red-500 text-center">Máx {product?.stock}</p>
                          )}
                        </td>
                        <td className="py-2 px-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 text-right"
                          />
                        </td>
                        <td className="py-2 px-1 text-right font-medium text-ib-primary">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </td>
                        <td className="py-2 pl-1">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-1.5 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-end gap-4 mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-ib-muted">Total:</span>
            <span className="text-xl font-bold text-ib-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "A guardar..." : "Finalizar Venda"}
          </button>
          <Link
            href="/gestao/vendas"
            className="text-sm text-ib-muted hover:text-ib-primary px-4 py-2.5"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
