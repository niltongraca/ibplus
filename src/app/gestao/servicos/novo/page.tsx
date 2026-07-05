"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/Toast";

export default function NovoServicoPage() {
  const [form, setForm] = useState({ name: "", description: "", price: "", duration: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      toast("Serviço criado com sucesso!", "success");
      router.push("/gestao/servicos");
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-ib-primary mb-6">Novo Serviço</h1>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4 bg-white p-6 rounded-xl border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-ib-primary mb-1">Nome do Serviço</label>
          <input
            type="text" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ib-primary mb-1">Descrição</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ib-primary mb-1">Preço (Kz)</label>
          <input
            type="number" required min="0" step="0.01" value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ib-primary mb-1">Duração (ex.: 1h, 2 dias, mensal)</label>
          <input
            type="text" value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
          />
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full bg-ib-accent hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "A criar..." : "Criar Serviço"}
        </button>
      </form>
    </>
  );
}
