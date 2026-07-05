"use client";

import { useState, useEffect } from "react";
import { CreditCard, Search } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";

interface Invoice {
  id: string;
  number: string;
  customer: string | null;
  date: string;
  total: number;
  status: string;
}

export default function PagamentosStorePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/invoices")
      .then((r) => r.json())
      .then((d) => setInvoices(d.invoices))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = invoices.filter((inv) =>
    (inv.number + " " + (inv.customer || "")).toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = { draft: "bg-gray-100 text-gray-600", sent: "bg-blue-100 text-blue-700", paid: "bg-green-100 text-green-700", overdue: "bg-red-100 text-red-700", cancelled: "bg-gray-100 text-gray-400" };
    const labels: Record<string, string> = { draft: "Rascunho", sent: "Enviada", paid: "Paga", overdue: "Vencida", cancelled: "Cancelada" };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}>{labels[status] || status}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Pagamentos</h1>
          <p className="text-ib-muted text-sm">Histórico de pagamentos da loja online</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Pesquisar facturas..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
        </div>

        <DataTable
          columns={[
            { key: "number", header: "N.º", render: (inv) => <span className="font-medium text-ib-primary">{inv.number}</span> },
            { key: "customer", header: "Cliente", hide: "tablet", render: (inv) => <span className="text-ib-muted">{inv.customer || "—"}</span> },
            { key: "date", header: "Data", render: (inv) => <span className="text-ib-muted">{formatDate(inv.date)}</span> },
            { key: "total", header: "Total", className: "text-right", render: (inv) => <span className="font-semibold">{formatCurrency(inv.total)}</span> },
            { key: "status", header: "Estado", render: (inv) => statusBadge(inv.status) },
            { key: "actions", header: "Acções", hide: "mobile", className: "text-right", render: () => (
              <span className="text-ib-accent text-xs font-medium cursor-pointer hover:underline">Detalhes</span>
            )},
          ]}
          data={filtered}
          loading={loading}
          emptyIcon={<CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhuma factura encontrada."
          keyExtractor={(inv) => inv.id}
          mobileCard={(inv) => (
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-ib-primary">{inv.number}</p>
                  <p className="text-xs text-ib-muted mt-0.5">{inv.customer || "—"}</p>
                </div>
                {statusBadge(inv.status)}
              </div>
              <p className="font-semibold text-ib-primary">{formatCurrency(inv.total)}</p>
            </div>
          )}
        />
      </div>
    </div>
  );
}
