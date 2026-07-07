"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Plus, GripVertical } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Opportunity {
  id: string;
  title: string;
  value: number;
  stage: string;
  notes: string | null;
  customer: { name: string; email: string | null; phone: string | null } | null;
}

const STAGES = [
  { key: "lead", label: "Lead", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { key: "qualified", label: "Qualificado", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { key: "proposal", label: "Proposta", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { key: "negotiation", label: "Negociação", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { key: "closed", label: "Fechado", color: "bg-green-100 text-green-700 border-green-200" },
];

export default function FunilVendasPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ customerId: "", title: "", value: "", stage: "lead" });

  useEffect(() => {
    fetch("/api/opportunities")
      .then((r) => r.json())
      .then((d) => setOpportunities(d.opportunities || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => setCustomers((d.customers || []).map((c: any) => ({ id: c.id, name: c.name }))))
      .catch(() => {});
  }, []);

  async function createOpportunity() {
    const res = await fetch("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, value: parseFloat(form.value) || 0 }),
    });
    if (res.ok) {
      const d = await res.json();
      setOpportunities((prev) => [d.opportunity, ...prev]);
      setShowModal(false);
      setForm({ customerId: "", title: "", value: "", stage: "lead" });
    }
  }

  async function moveToStage(id: string, stage: string) {
    await fetch("/api/opportunities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stage }),
    });
    setOpportunities((prev) => prev.map((o) => (o.id === id ? { ...o, stage } : o)));
  }

  const grouped = STAGES.map((s) => ({
    ...s,
    items: opportunities.filter((o) => o.stage === s.key),
  }));

  if (loading) return <div className="p-12 text-center text-ib-muted">A carregar...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Funil de Vendas</h1>
          <p className="text-ib-muted text-sm">Acompanhe as oportunidades do negócio</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Nova Oportunidade
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
        {grouped.map((stage) => (
          <div key={stage.key} className="flex-shrink-0 w-72 snap-start">
            <div className={`rounded-xl border px-4 py-2.5 mb-3 ${stage.color}`}>
              <p className="text-sm font-semibold">{stage.label}</p>
              <p className="text-xs opacity-75">{stage.items.length} oportunidade{stage.items.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="space-y-3 min-h-[200px]">
              {stage.items.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-ib-primary text-sm">{item.title}</p>
                    <div className="relative group">
                      <GripVertical className="w-4 h-4 text-ib-muted cursor-grab" />
                      <div className="absolute right-0 top-6 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                        {STAGES.filter((s) => s.key !== item.stage).map((s) => (
                          <button key={s.key} onClick={() => moveToStage(item.id, s.key)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50">
                            Mover para {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {item.customer && (
                    <p className="text-xs text-ib-muted mb-1">{item.customer.name}</p>
                  )}
                  <p className="text-sm font-semibold text-ib-accent mt-2">{formatCurrency(item.value)}</p>
                  {item.notes && (
                    <p className="text-xs text-ib-muted mt-1 line-clamp-2">{item.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-ib-accent" />
          <h3 className="font-semibold text-ib-primary">Resumo do Funil</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {grouped.map((stage) => (
            <div key={stage.key} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-ib-muted mb-1">{stage.label}</p>
              <p className="text-lg font-bold text-ib-primary">
                {formatCurrency(stage.items.reduce((sum, o) => sum + o.value, 0))}
              </p>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-semibold text-ib-primary mb-4">Nova Oportunidade</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Cliente</label>
                <select value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                  <option value="">Seleccionar cliente</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Título</label>
                <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Venda de produtos" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Valor Estimado (Kz)</label>
                <input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder="0" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Etapa</label>
                <select value={form.stage} onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancelar</button>
              <button onClick={createOpportunity} disabled={!form.title} className="px-4 py-2 bg-ib-accent text-white rounded-lg text-sm font-medium disabled:opacity-50">Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
