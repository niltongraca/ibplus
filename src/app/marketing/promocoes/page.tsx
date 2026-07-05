"use client";

import { useState, useEffect } from "react";
import { Tag, Search, Plus, Calendar, Percent, MoreHorizontal } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  notes: string | null;
}

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho", active: "Activa", paused: "Pausada", completed: "Concluída", cancelled: "Cancelada",
};

export default function PromocoesPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "other", status: "draft", startDate: "", endDate: "", budget: "", notes: "" });

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((d) => setCampaigns((d.campaigns || []).filter((c: Campaign) => c.type === "other")))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = campaigns.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: "other" }),
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns((prev) => [data.campaign, ...prev]);
        setShowForm(false);
        setForm({ name: "", type: "other", status: "draft", startDate: "", endDate: "", budget: "", notes: "" });
      }
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Promoções</h1>
          <p className="text-ib-muted text-sm">Gestão de promoções e descontos</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-ib-accent/90 transition-colors">
          <Plus className="w-4 h-4" /> Nova Promoção
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ib-primary mb-4">Nova Promoção</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Nome da Promoção</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Ex: Desconto de Natal" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ib-primary mb-1">Início</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ib-primary mb-1">Fim</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Orçamento (Kz)</label>
                <input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Valor do desconto ou investimento" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Descrição / Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={3} placeholder="Condições da promoção, produtos abrangidos, etc." />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-ib-muted hover:text-ib-primary transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-ib-accent/90 transition-colors">Criar Promoção</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Pesquisar promoções..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
        </div>
        <DataTable
          columns={[
            { key: "name", header: "Nome", render: (c: Campaign) => (
              <div>
                <span className="font-medium text-ib-primary">{c.name}</span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[c.status] || "bg-gray-100 text-gray-600"}`}>{statusLabels[c.status] || c.status}</span>
              </div>
            )},
            { key: "startDate", header: "Início", hide: "tablet", render: (c: Campaign) => <span className="text-ib-muted">{c.startDate ? formatDate(c.startDate) : "—"}</span> },
            { key: "endDate", header: "Fim", hide: "tablet", render: (c: Campaign) => <span className="text-ib-muted">{c.endDate ? formatDate(c.endDate) : "—"}</span> },
            { key: "budget", header: "Valor", hide: "mobile", className: "text-right", render: (c: Campaign) => <span className="font-semibold">{c.budget ? formatCurrency(c.budget) : "—"}</span> },
            { key: "actions", header: "", hide: "mobile", className: "text-right w-10", render: () => <MoreHorizontal className="w-4 h-4 text-ib-muted" /> },
          ]}
          data={filtered}
          loading={loading}
          emptyIcon={<Percent className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhuma promoção encontrada."
          keyExtractor={(c: Campaign) => c.id}
          mobileCard={(c: Campaign) => (
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-ib-primary">{c.name}</p>
                  <p className="text-xs text-ib-muted mt-0.5">{statusLabels[c.status] || c.status}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-ib-muted">
                {c.startDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(c.startDate)}</span>}
                {c.budget && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{formatCurrency(c.budget)}</span>}
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
