"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Search, Plus, Phone, Mail, UserCheck, Calendar, MoreHorizontal } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

export default function FollowUpPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [followUps, setFollowUps] = useState<Record<string, { date: string; note: string }[]>>({});
  const [showForm, setShowForm] = useState<string | null>(null);
  const [formNote, setFormNote] = useState("");

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers || []))
      .catch((err) => console.error("Erro ao carregar follow-up:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  function addFollowUp(customerId: string) {
    if (!formNote.trim()) return;
    const entry = { date: new Date().toISOString(), note: formNote };
    setFollowUps((prev) => ({
      ...prev,
      [customerId]: [entry, ...(prev[customerId] || [])],
    }));
    setShowForm(null);
    setFormNote("");
  }

  function getLastFollowUp(customerId: string): string | null {
    const entries = followUps[customerId];
    if (!entries || entries.length === 0) return null;
    return entries[0].date;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ib-primary">Follow-up</h1>
        <p className="text-ib-muted text-sm">Acompanhamento de leads e clientes</p>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-ib-primary mb-3">Registar Follow-up</h3>
            <textarea value={formNote} onChange={(e) => setFormNote(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={3} placeholder="Notas do acompanhamento..." autoFocus />
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setShowForm(null)} className="px-4 py-2 text-sm text-ib-muted hover:text-ib-primary">Cancelar</button>
              <button onClick={() => addFollowUp(showForm)} className="px-4 py-2 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-ib-accent/90">Registar</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Pesquisar clientes..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
        </div>
        <DataTable
          columns={[
            { key: "name", header: "Cliente", render: (c: Customer) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-bold text-ib-accent">{c.name.charAt(0)}</div>
                <div>
                  <span className="font-medium text-ib-primary">{c.name}</span>
                  <p className="text-xs text-ib-muted">{c.email || c.phone || "—"}</p>
                </div>
              </div>
            )},
            { key: "phone", header: "Contacto", hide: "tablet", render: (c: Customer) => (
              <div className="flex items-center gap-2">
                {c.phone && <><Phone className="w-3 h-3 text-ib-muted" /><span className="text-ib-muted text-sm">{c.phone}</span></>}
                {!c.phone && <span className="text-ib-muted">—</span>}
              </div>
            )},
            { key: "lastFollowUp", header: "Último Contacto", hide: "tablet", render: (c: Customer) => {
              const last = getLastFollowUp(c.id);
              return <span className="text-ib-muted text-sm">{last ? formatDate(last) : "—"}</span>;
            }},
            { key: "actions", header: "", className: "text-right", render: (c: Customer) => (
              <button onClick={() => setShowForm(c.id)} className="flex items-center gap-1 text-xs text-ib-accent font-medium hover:underline ml-auto">
                <Plus className="w-3 h-3" /> Follow-up
              </button>
            )},
          ]}
          data={filtered}
          loading={loading}
          emptyIcon={<MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhum cliente encontrado."
          keyExtractor={(c: Customer) => c.id}
          mobileCard={(c: Customer) => {
            const last = getLastFollowUp(c.id);
            return (
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-ib-primary">{c.name}</p>
                  <p className="text-xs text-ib-muted mt-0.5">{c.email || c.phone || "—"}</p>
                  {last && <p className="text-xs text-ib-muted mt-1">Último: {formatDate(last)}</p>}
                </div>
                <button onClick={() => setShowForm(c.id)} className="text-xs text-ib-accent font-medium hover:underline whitespace-nowrap">+ Follow-up</button>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
