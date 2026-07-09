"use client";

import { useState, useEffect } from "react";
import { Plus, Search, TrendingDown, Trash2, CheckCircle, XCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import Pagination from "@/components/Pagination";
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/expenses?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((d) => { setExpenses(d.expenses || []); setTotalPages(d.totalPages || 1); })
      .catch((err) => console.error("Erro ao carregar despesas:", err))
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = expenses.filter((e) => {
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" ? true : filter === "paid" ? e.paid : !e.paid;
    return matchSearch && matchFilter;
  });

  const { toast } = useToast();
  const { confirm } = useConfirm();

  const handleTogglePaid = async (id: string, currentPaid: boolean) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: !currentPaid }),
      });
      if (!res.ok) throw new Error();
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, paid: !currentPaid } : e))
      );
      toast(currentPaid ? "Despesa marcada como não paga." : "Despesa marcada como paga.");
    } catch {
      toast("Erro ao atualizar despesa.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Eliminar despesa", message: "Tem a certeza que deseja eliminar esta despesa?", variant: "danger" }))) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast("Despesa eliminada com sucesso.");
    } catch {
      toast("Erro ao eliminar despesa.", "error");
    }
  };

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
            { key: "actions", header: "Acções", hide: "mobile", className: "text-center", render: (e) => (
              <div className="flex items-center justify-center gap-1">
                <button onClick={() => handleTogglePaid(e.id, e.paid)} className={`p-1.5 rounded-lg transition-colors ${e.paid ? "text-yellow-600 hover:bg-yellow-50" : "text-green-600 hover:bg-green-50"}`} title={e.paid ? "Marcar como não paga" : "Marcar como paga"}>
                  {e.paid ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDelete(e.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
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
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
