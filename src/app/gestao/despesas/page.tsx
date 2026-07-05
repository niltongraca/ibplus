"use client";

import { useState, useEffect } from "react";
import { Plus, Search, TrendingDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";
import Link from "next/link";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  paid: boolean;
}

export default function DespesasPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/expenses")
      .then((r) => r.json())
      .then((d) => setExpenses(d.expenses))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = expenses.filter((e) => {
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" ? true : filter === "paid" ? e.paid : !e.paid;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Despesas</h1>
          <p className="text-ib-muted text-sm">Controlo de despesas operacionais</p>
        </div>
        <Link href="/gestao/despesas/nova" className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Nova Despesa
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Pesquisar despesas..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40">
            <option value="all">Todas</option>
            <option value="paid">Pagas</option>
            <option value="unpaid">Por Pagar</option>
          </select>
        </div>

        <DataTable
          columns={[
            { key: "description", header: "Descrição", render: (e) => <span className="font-medium text-ib-primary">{e.description}</span> },
            { key: "category", header: "Categoria", hide: "mobile", render: (e) => <span className="text-ib-muted">{e.category}</span> },
            { key: "date", header: "Data", render: (e) => <span className="text-ib-muted">{formatDate(e.date)}</span> },
            { key: "amount", header: "Valor", className: "text-right", render: (e) => <span className="font-semibold">{formatCurrency(e.amount)}</span> },
            { key: "paid", header: "Pago", hide: "mobile", className: "text-center", render: (e) => (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.paid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {e.paid ? "Pago" : "Pendente"}
              </span>
            )},
          ]}
          data={filtered}
          loading={loading}
          emptyIcon={<TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhuma despesa encontrada."
          keyExtractor={(e) => e.id}
          mobileCard={(e) => (
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-ib-primary">{e.description}</p>
                  <p className="text-xs text-ib-muted mt-0.5">{e.category}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.paid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {e.paid ? "Pago" : "Pendente"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ib-muted">{formatDate(e.date)}</span>
                <span className="font-semibold text-ib-primary">{formatCurrency(e.amount)}</span>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
