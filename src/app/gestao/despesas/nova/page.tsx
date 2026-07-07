"use client";

import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  "aluguer", "água", "luz", "internet", "salários", "impostos", "transportes", "outros"
];

export default function NovaDespesaPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "outros",
    date: new Date().toISOString().split("T")[0],
    paid: false,
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.description,
          amount: parseFloat(form.amount),
          category: form.category,
          date: new Date(form.date).toISOString(),
          paid: form.paid,
          notes: form.notes || null,
        }),
      });
      if (res.ok) router.push("/gestao/despesas");
    } catch (err) {
      console.error("Erro ao criar despesa:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/gestao/despesas" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-ib-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Nova Despesa</h1>
          <p className="text-ib-muted text-sm">Registar nova despesa operacional</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-ib-primary mb-1">Descrição *</label>
            <input
              type="text"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Valor *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Categoria</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Data</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>

          <div className="flex items-end pb-2.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.paid}
                onChange={(e) => setForm({ ...form, paid: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-ib-accent focus:ring-ib-accent/40"
              />
              <span className="text-sm font-medium text-ib-primary">Pago</span>
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-ib-primary mb-1">Notas</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "A guardar..." : "Guardar"}
          </button>
          <Link
            href="/gestao/despesas"
            className="text-sm text-ib-muted hover:text-ib-primary px-4 py-2.5"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
