"use client";

import { useState, useEffect } from "react";
import { Package, Search } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";

interface Sale {
  id: string;
  date: string;
  total: number;
  status: string;
  customer: { name: string } | null;
}

export default function EncomendasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/sales")
      .then((r) => r.json())
      .then((d) => setSales(d.sales))
      .catch((err) => console.error("Erro ao carregar encomendas:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = sales.filter((s) =>
    (s.customer?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = { pending: "bg-yellow-100 text-yellow-700", completed: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700" };
    const labels: Record<string, string> = { pending: "Pendente", completed: "Concluída", cancelled: "Cancelada" };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}>{labels[status] || status}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Encomendas</h1>
          <p className="text-ib-muted text-sm">Acompanhe e gerencie as encomendas</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Pesquisar por cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
        </div>

        <DataTable
          columns={[
            { key: "date", header: "Data", render: (s) => <span className="text-ib-muted">{formatDate(s.date)}</span> },
            { key: "customer", header: "Cliente", render: (s) => <span className="font-medium text-ib-primary">{s.customer?.name || "—"}</span> },
            { key: "total", header: "Total", className: "text-right", render: (s) => <span className="font-semibold">{formatCurrency(s.total)}</span> },
            { key: "status", header: "Estado", hide: "mobile", render: (s) => statusBadge(s.status) },
            { key: "actions", header: "Acções", hide: "mobile", className: "text-right", render: () => (
              <span className="text-ib-accent text-xs font-medium cursor-pointer hover:underline">Detalhes</span>
            )},
          ]}
          data={filtered}
          loading={loading}
          emptyIcon={<Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhuma encomenda encontrada."
          keyExtractor={(s) => s.id}
          mobileCard={(s) => (
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-ib-primary">{s.customer?.name || "—"}</p>
                  <p className="text-xs text-ib-muted mt-0.5">{formatDate(s.date)}</p>
                </div>
                {statusBadge(s.status)}
              </div>
              <p className="font-semibold text-ib-primary">{formatCurrency(s.total)}</p>
            </div>
          )}
        />
      </div>
    </div>
  );
}
