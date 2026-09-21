"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Wrench } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import { CardSkeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";
import { useList } from "@/hooks/useList";
import { formatCurrency } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: string | null;
  active: boolean;
}

export default function ServicosPage() {
  const [search, setSearch] = useState("");
  const { data: services, setData: setServices, loading, page, setPage, totalPages } = useList<Service>("/api/services", "services", { limit: 20, params: { search } });
  const { toast } = useToast();
  const { confirm } = useConfirm();

  async function handleDelete(id: string) {
    if (!(await confirm({ title: "Eliminar serviço", message: "Tem a certeza que pretende eliminar este serviço?", variant: "danger" }))) return;
    const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast("Serviço eliminado com sucesso!", "success");
    } else {
      toast(data?.error || "Erro ao eliminar serviço.", "error");
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Serviços</h1>
        <Link
          href="/gestao/servicos/novo"
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4" /> Novo Serviço
        </Link>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ib-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar serviços..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
        />
      </div>

      {loading ? (
        <CardSkeleton count={6} />
      ) : services.length === 0 ? (
        <EmptyState
          icon={<Wrench className="w-8 h-8 text-gray-400" />}
          title="Nenhum serviço encontrado"
          description={search ? "Tente alterar a pesquisa." : "Adicione o primeiro serviço."}
          actionHref={search ? undefined : "/gestao/servicos/novo"}
          actionLabel={search ? undefined : "Novo Serviço"}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div key={service.id} className="card p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ib-accent/10 flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-ib-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ib-primary">{service.name}</h3>
                      {service.duration && (
                        <p className="text-xs text-ib-muted">{service.duration}</p>
                      )}
                    </div>
                  </div>
                </div>
                {service.description && (
                  <p className="text-sm text-ib-muted mb-4 line-clamp-2">{service.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-ib-primary">{formatCurrency(service.price)}</span>
                  <div className="flex items-center gap-1">
                    <Link href={`/gestao/servicos/${service.id}/editar`} className="p-1.5 hover:bg-gray-100 rounded-lg text-ib-muted hover:text-ib-primary min-w-[44px] min-h-[44px] flex items-center justify-center">
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDelete(service.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-ib-muted hover:text-ib-danger min-w-[44px] min-h-[44px] flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </>
  );
}
