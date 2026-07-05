"use client";

import { useState, useEffect } from "react";
import { FileText, Search, Plus, Calendar, Download, MoreHorizontal } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Quote {
  id: string;
  number: string;
  customer: string | null;
  date: string;
  validUntil: string | null;
  total: number;
  status: string;
  notes: string | null;
  items: QuoteItem[];
}

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-yellow-100 text-yellow-700",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho", sent: "Enviada", accepted: "Aceite", rejected: "Rejeitada", expired: "Expirada",
};

export default function PropostasPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer: "", validUntil: "", notes: "", itemDesc: "", itemQty: "1", itemPrice: "" });
  const [items, setItems] = useState<{ description: string; quantity: number; unitPrice: number }[]>([]);

  useEffect(() => {
    fetch("/api/quotes")
      .then((r) => r.json())
      .then((d) => setQuotes(d.quotes))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = quotes.filter((q) =>
    (q.customer || q.number).toLowerCase().includes(search.toLowerCase())
  );

  function addItem() {
    if (!form.itemDesc || !form.itemPrice) return;
    setItems([...items, { description: form.itemDesc, quantity: parseInt(form.itemQty) || 1, unitPrice: parseFloat(form.itemPrice) }]);
    setForm({ ...form, itemDesc: "", itemQty: "1", itemPrice: "" });
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: form.customer, validUntil: form.validUntil, notes: form.notes, items }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuotes((prev) => [data.quote, ...prev]);
        setShowForm(false);
        setItems([]);
        setForm({ customer: "", validUntil: "", notes: "", itemDesc: "", itemQty: "1", itemPrice: "" });
      }
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Propostas</h1>
          <p className="text-ib-muted text-sm">Criação e gestão de propostas comerciais</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-ib-accent/90 transition-colors">
          <Plus className="w-4 h-4" /> Nova Proposta
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-xl mt-10 mb-10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ib-primary mb-4">Nova Proposta</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ib-primary mb-1">Cliente</label>
                  <input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Nome do cliente" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ib-primary mb-1">Válido até</label>
                  <input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-ib-primary mb-3">Itens da Proposta</p>
                {items.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-ib-primary">{item.description}</p>
                          <p className="text-xs text-ib-muted">{item.quantity}x {formatCurrency(item.unitPrice)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">{formatCurrency(item.quantity * item.unitPrice)}</span>
                          <button type="button" onClick={() => removeItem(idx)} className="text-red-500 text-xs hover:underline">Remover</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <label className="block text-xs text-ib-muted mb-1">Descrição</label>
                    <input value={form.itemDesc} onChange={(e) => setForm({ ...form, itemDesc: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" placeholder="Produto/serviço" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-ib-muted mb-1">Qtd</label>
                    <input type="number" min="1" value={form.itemQty} onChange={(e) => setForm({ ...form, itemQty: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-ib-muted mb-1">Preço Unit.</label>
                    <input type="number" step="0.01" value={form.itemPrice} onChange={(e) => setForm({ ...form, itemPrice: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" />
                  </div>
                  <div className="col-span-2">
                    <button type="button" onClick={addItem} className="w-full px-2 py-1.5 bg-gray-100 text-ib-primary rounded text-sm font-medium hover:bg-gray-200 transition-colors">+</button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2} />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-ib-muted">Total itens: <span className="font-bold text-ib-primary">{items.length}</span></p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowForm(false); setItems([]); }} className="px-4 py-2 text-sm text-ib-muted hover:text-ib-primary transition-colors">Cancelar</button>
                  <button type="submit" disabled={items.length === 0} className="px-4 py-2 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-ib-accent/90 disabled:opacity-50 transition-colors">Criar Proposta</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Pesquisar propostas..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
        </div>
        <DataTable
          columns={[
            { key: "number", header: "N.º", render: (q: Quote) => <span className="font-medium text-ib-primary">{q.number}</span> },
            { key: "customer", header: "Cliente", render: (q: Quote) => <span className="text-ib-muted">{q.customer || "—"}</span> },
            { key: "date", header: "Data", render: (q: Quote) => <span className="text-ib-muted text-sm">{formatDate(q.date)}</span> },
            { key: "total", header: "Total", className: "text-right", render: (q: Quote) => <span className="font-semibold">{formatCurrency(q.total)}</span> },
            { key: "status", header: "Estado", render: (q: Quote) => (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[q.status] || "bg-gray-100 text-gray-600"}`}>{statusLabels[q.status] || q.status}</span>
            )},
            { key: "actions", header: "", hide: "mobile", className: "text-right w-10", render: () => <MoreHorizontal className="w-4 h-4 text-ib-muted" /> },
          ]}
          data={filtered}
          loading={loading}
          emptyIcon={<FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhuma proposta encontrada."
          keyExtractor={(q: Quote) => q.id}
          mobileCard={(q: Quote) => (
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-ib-primary">{q.number}</p>
                  <p className="text-xs text-ib-muted mt-0.5">{q.customer || "—"}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[q.status]}`}>{statusLabels[q.status]}</span>
              </div>
              <p className="font-semibold text-ib-primary">{formatCurrency(q.total)}</p>
            </div>
          )}
        />
      </div>
    </div>
  );
}
