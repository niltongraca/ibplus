"use client";

import { useState, useEffect } from "react";
import { Mail, Search, Plus, Calendar, Send, MoreHorizontal } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string | null;
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

export default function EmailMarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", status: "draft", startDate: "", notes: "" });

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((d) => setCampaigns((d.campaigns || []).filter((c: Campaign) => c.type === "email")))
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
        body: JSON.stringify({ ...form, type: "email" }),
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns((prev) => [data.campaign, ...prev]);
        setShowForm(false);
        setForm({ name: "", status: "draft", startDate: "", notes: "" });
      }
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">E-mail Marketing</h1>
          <p className="text-ib-muted text-sm">Campanhas de e-mail marketing automatizadas</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-ib-accent/90 transition-colors">
          <Plus className="w-4 h-4" /> Nova Campanha
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ib-primary mb-4">Nova Campanha de E-mail</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Nome</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Ex: Newsletter Julho" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Data de Envio</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Conteúdo / Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={4} placeholder="Descreva o conteúdo do e-mail, público-alvo, etc." />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-ib-muted hover:text-ib-primary transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-ib-accent/90 transition-colors">Criar Campanha</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Pesquisar campanhas..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
        </div>
        <DataTable
          columns={[
            { key: "name", header: "Nome", render: (c: Campaign) => (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-ib-accent" />
                <span className="font-medium text-ib-primary">{c.name}</span>
              </div>
            )},
            { key: "status", header: "Estado", render: (c: Campaign) => (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[c.status] || "bg-gray-100 text-gray-600"}`}>{statusLabels[c.status] || c.status}</span>
            )},
            { key: "startDate", header: "Envio", hide: "tablet", render: (c: Campaign) => <span className="text-ib-muted">{c.startDate ? formatDate(c.startDate) : "—"}</span> },
            { key: "actions", header: "", hide: "mobile", className: "text-right w-10", render: () => <MoreHorizontal className="w-4 h-4 text-ib-muted" /> },
          ]}
          data={filtered}
          loading={loading}
          emptyIcon={<Send className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhuma campanha de e-mail."
          keyExtractor={(c: Campaign) => c.id}
          mobileCard={(c: Campaign) => (
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-ib-primary">{c.name}</p>
                <p className="text-xs text-ib-muted mt-0.5">{c.startDate ? formatDate(c.startDate) : "Sem data"}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[c.status]}`}>{statusLabels[c.status]}</span>
            </div>
          )}
        />
      </div>
    </div>
  );
}
