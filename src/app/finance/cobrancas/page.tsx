"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, FileText } from "lucide-react";

interface Invoice {
  id: string;
  number: string;
  customer: string | null;
  date: string;
  dueDate: string | null;
  total: number;
  status: string;
}

type FilterTab = "all" | "sent" | "overdue";

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "sent", label: "Por Cobrar" },
  { key: "overdue", label: "Vencidas" },
];

export default function CobrancasPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  useEffect(() => {
    fetch("/api/invoices")
      .then((r) => r.json())
      .then((d) => setInvoices(d.invoices))
      .catch((err) => console.error("Erro ao carregar cobranças:", err))
      .finally(() => setLoading(false));
  }, []);

  const searched = invoices.filter((inv) =>
    (inv.number + " " + (inv.customer || "")).toLowerCase().includes(search.toLowerCase())
  );

  const filtered = searched.filter((inv) => {
    if (activeTab === "all") return inv.status === "sent" || inv.status === "overdue";
    return inv.status === activeTab;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      sent: "bg-blue-100 text-blue-700",
      overdue: "bg-red-100 text-red-700",
      paid: "bg-green-100 text-green-700",
    };
    const labels: Record<string, string> = {
      sent: "Por Cobrar",
      overdue: "Vencida",
      paid: "Paga",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const columns = [
    {
      key: "number",
      header: "N.º",
      render: (inv: Invoice) => <span className="font-medium text-ib-primary">{inv.number}</span>,
    },
    {
      key: "customer",
      header: "Cliente",
      hide: "tablet" as const,
      render: (inv: Invoice) => <span className="text-ib-muted">{inv.customer || "—"}</span>,
    },
    {
      key: "date",
      header: "Data",
      render: (inv: Invoice) => <span className="text-ib-muted">{formatDate(inv.date)}</span>,
    },
    {
      key: "dueDate",
      header: "Vencimento",
      render: (inv: Invoice) => <span className="text-ib-muted">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</span>,
    },
    {
      key: "total",
      header: "Total",
      className: "text-right font-semibold",
      render: (inv: Invoice) => <span>{formatCurrency(inv.total)}</span>,
    },
    {
      key: "status",
      header: "Estado",
      className: "text-center",
      render: (inv: Invoice) => getStatusBadge(inv.status),
    },
  ];

  const mobileCard = (inv: Invoice) => (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-ib-primary">{inv.number}</p>
        <p className="text-sm text-ib-muted">{inv.customer || "—"}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold">{formatCurrency(inv.total)}</p>
        <div className="mt-1">{getStatusBadge(inv.status)}</div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ib-primary">Cobranças</h1>
        <p className="text-ib-muted text-sm">Controle e gerencie as suas cobranças pendentes.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center gap-4">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar cobranças..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-ib-accent text-white"
                    : "text-ib-muted hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          emptyIcon={<FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhuma cobrança encontrada."
          mobileCard={mobileCard}
          keyExtractor={(inv) => inv.id}
        />
      </div>
    </div>
  );
}
