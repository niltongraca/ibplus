"use client";

import { useState } from "react";
import { Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import Pagination from "@/components/Pagination";
import { useList } from "@/hooks/useList";
import Link from "next/link";

interface Purchase {
  id: string;
  supplier: string | null;
  date: string;
  total: number;
  status: string;
}

export default function ComprasPage() {
  const [search, setSearch] = useState("");
  const { data: purchases, setData: setPurchases, loading, page, setPage, totalPages } = useList<Purchase>(
    "/api/purchases",
    "purchases",
    { limit: 20, params: { search } }
  );

  const { toast } = useToast();
  const { confirm } = useConfirm();

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Eliminar compra", message: "Tem a certeza que deseja eliminar esta compra?", variant: "danger" }))) return;
    try {
      const res = await fetch(`/api/purchases/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPurchases((prev) => prev.filter((p) => p.id !== id));
      toast("Compra eliminada com sucesso.");
    } catch {
      toast("Erro ao eliminar compra.", "error");
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = { pending: "bg-yellow-100 text-yellow-700", completed: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700" };
    const labels: Record<string, string> = { pending: "Pendente", completed: "Concluída", cancelled: "Cancelada" };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}>{labels[status] || status}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Compras</h1>
          <p className="text-ib-muted text-sm">Registo de compras a fornecedores</p>
        </div>
        <Link href="/gestao/compras/nova" className="btn btn-primary">
          <Plus className="w-4 h-4" /> Nova Compra
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Pesquisar compras..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
        </div>

        <DataTable
          columns={[
            { key: "date", header: "Data", render: (p) => <span className="text-ib-muted">{formatDate(p.date)}</span> },
            { key: "supplier", header: "Fornecedor", render: (p) => <span className="font-medium text-ib-primary">{p.supplier || "—"}</span> },
            { key: "total", header: "Total", className: "text-right", render: (p) => <span className="font-semibold">{formatCurrency(p.total)}</span> },
            { key: "status", header: "Estado", hide: "mobile", className: "text-center", render: (p) => statusBadge(p.status) },
            { key: "actions", header: "Acções", hide: "mobile", className: "text-center", render: (p) => (
              <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Eliminar">
                <Trash2 className="w-4 h-4" />
              </button>
            )},
          ]}
          data={purchases}
          loading={loading}
          emptyIcon={<ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhuma compra encontrada."
          keyExtractor={(p) => p.id}
          mobileCard={(p) => (
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-ib-primary">{p.supplier || "—"}</p>
                  <p className="text-xs text-ib-muted mt-0.5">{formatDate(p.date)}</p>
                </div>
                {statusBadge(p.status)}
              </div>
              <p className="font-semibold text-ib-primary">{formatCurrency(p.total)}</p>
            </div>
          )}
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
