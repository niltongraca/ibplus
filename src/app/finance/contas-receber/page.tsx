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

type FilterTab = "all" | "unpaid" | "paid";

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "unpaid", label: "Por Receber" },
  { key: "paid", label: "Recebidas" },
];

export default function ContasReceberPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  useEffect(() => {
    fetch("/api/invoices")
      .then((r) => r.json())
      .then((d) => setInvoices(d.invoices))
      .catch((err) => console.error("Erro ao carregar contas a receber:", err))
      .finally(() => setLoading(false));
  }, []);

  const searched = invoices.filter((inv) =>
    (inv.number + " " + (inv.customer || "")).toLowerCase().includes(search.toLowerCase())
  );

  const filtered = searched.filter((inv) => {
    if (activeTab === "all") return inv.status !== "cancelled";
    if (activeTab === "unpaid") return inv.status === "draft" || inv.status === "sent" || inv.status === "overdue";
    return inv.status === "paid";
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-600",
      sent: "bg-blue-100 text-blue-700",
      paid: "bg-green-100 text-green-700",
      overdue: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
      draft: "Rascunho",
      sent: "Por Receber",
      paid: "Recebida",
      overdue: "Vencida",
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

  const unpaidTotal = filtered.filter(i => i.status !== "paid" && i.status !== "cancelled").reduce((sum, i) => sum + i.total, 0);
  const paidTotal = filtered.filter(i => i.status === "paid").reduce((sum, i) => sum + i.total, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contas a Receber</h1>
        <p className="text-gray-500 text-sm">Acompanhe as contas a receber e recebimentos pendentes.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Total</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(unpaidTotal + paidTotal)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Por Receber</p>
          <p className="text-xl font-bold text-orange-600">{formatCurrency(unpaidTotal)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Recebidas</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(paidTotal)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center gap-4">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar faturas..."
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
          emptyText="Nenhuma fatura encontrada."
          mobileCard={mobileCard}
          keyExtractor={(inv) => inv.id}
        />
      </div>
    </div>
  );
}
