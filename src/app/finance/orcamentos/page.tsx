"use client";

import { useState, useEffect } from "react";
import { Plus, Search, FileDown, Eye, Trash2, ScrollText } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

interface Quote {
  id: string;
  number: string;
  customer: string | null;
  date: string;
  validUntil: string | null;
  total: number;
  status: string;
}

export default function OrcamentosPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/quotes")
      .then((r) => r.json())
      .then((d) => setQuotes(d.quotes))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = quotes.filter((q) =>
    (q.number + " " + (q.customer || "")).toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-600",
      sent: "bg-blue-100 text-blue-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      converted: "bg-ib-accent/10 text-ib-accent",
    };
    const labels: Record<string, string> = {
      draft: "Rascunho",
      sent: "Enviado",
      approved: "Aprovado",
      rejected: "Rejeitado",
      converted: "Convertido",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  async function removeQuote(id: string) {
    if (!confirm("Eliminar orçamento?")) return;
    await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Orçamentos</h1>
          <p className="text-ib-muted text-sm">Gerir orçamentos para clientes</p>
        </div>
        <Link
          href="/finance/orcamentos/novo"
          className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Orçamento
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar orçamentos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-ib-muted">A carregar...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-ib-muted">Nenhum orçamento encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-ib-muted text-xs uppercase tracking-wider">
                  <th className="text-left p-4 font-medium">N.º</th>
                  <th className="text-left p-4 font-medium">Cliente</th>
                  <th className="text-left p-4 font-medium">Data</th>
                  <th className="text-left p-4 font-medium">Validade</th>
                  <th className="text-right p-4 font-medium">Total</th>
                  <th className="text-center p-4 font-medium">Estado</th>
                  <th className="text-right p-4 font-medium">Acções</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 font-medium text-ib-primary">{q.number}</td>
                    <td className="p-4 text-ib-muted">{q.customer || "—"}</td>
                    <td className="p-4 text-ib-muted">{formatDate(q.date)}</td>
                    <td className="p-4 text-ib-muted">{q.validUntil ? formatDate(q.validUntil) : "—"}</td>
                    <td className="p-4 text-right font-semibold">{formatCurrency(q.total)}</td>
                    <td className="p-4 text-center">{getStatusBadge(q.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/finance/orcamentos/${q.id}`}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4 text-ib-muted" />
                        </Link>
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <FileDown className="w-4 h-4 text-ib-muted" />
                        </button>
                        <button onClick={() => removeQuote(q.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
