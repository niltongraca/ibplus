"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, FileText } from "lucide-react";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  paid: boolean;
}

type FilterTab = "all" | "unpaid" | "paid";

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "unpaid", label: "Por Pagar" },
  { key: "paid", label: "Pagas" },
];

export default function ContasPagarPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  useEffect(() => {
    fetch("/api/expenses")
      .then((r) => r.json())
      .then((d) => setExpenses(d.expenses))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const searched = expenses.filter((exp) =>
    exp.description.toLowerCase().includes(search.toLowerCase())
  );

  const filtered = searched.filter((exp) => {
    if (activeTab === "all") return true;
    if (activeTab === "unpaid") return !exp.paid;
    return exp.paid;
  });

  const getPaidBadge = (paid: boolean) => {
    if (paid) {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
          Paga
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">
        Por Pagar
      </span>
    );
  };

  const columns = [
    {
      key: "description",
      header: "Descrição",
      render: (exp: Expense) => <span className="text-ib-primary">{exp.description}</span>,
    },
    {
      key: "category",
      header: "Categoria",
      hide: "mobile" as const,
      render: (exp: Expense) => <span className="text-ib-muted">{exp.category}</span>,
    },
    {
      key: "date",
      header: "Data",
      render: (exp: Expense) => <span className="text-ib-muted">{formatDate(exp.date)}</span>,
    },
    {
      key: "amount",
      header: "Valor",
      className: "text-right font-semibold",
      render: (exp: Expense) => <span>{formatCurrency(exp.amount)}</span>,
    },
    {
      key: "paid",
      header: "Estado",
      className: "text-center",
      render: (exp: Expense) => getPaidBadge(exp.paid),
    },
  ];

  const mobileCard = (exp: Expense) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-medium text-ib-primary">{exp.description}</p>
        <p className="font-semibold">{formatCurrency(exp.amount)}</p>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ib-muted">{formatDate(exp.date)}</span>
        {getPaidBadge(exp.paid)}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ib-primary">Contas a Pagar</h1>
        <p className="text-ib-muted text-sm">Gerencie todas as contas a pagar do seu negócio.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center gap-4">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar despesas..."
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
          emptyText="Nenhuma despesa encontrada."
          mobileCard={mobileCard}
          keyExtractor={(exp) => exp.id}
        />
      </div>
    </div>
  );
}
