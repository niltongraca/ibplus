"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Wrench } from "lucide-react";
import { useToast } from "@/components/Toast";
import { CardSkeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: string | null;
  active: boolean;
}

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/services?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((d) => { setServices(d.services || []); setTotalPages(d.totalPages || 1); })
      .catch((err) => console.error("Erro ao carregar serviços:", err))
      .finally(() => setLoading(false));
  }, [page]);

  async function handleDelete(id: string) {
    if (!confirm("Tem a certeza que pretende eliminar este serviço?")) return;
    const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (res.ok) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast("Serviço eliminado com sucesso!", "success");
    }
  }

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ib-primary">Serviços</h1>
        <Link
          href="/gestao/servicos/novo"
          className="inline-flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
      ) : filtered.length === 0 ? (
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
            {filtered.map((service) => (
              <div key={service.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all">
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
                  <span className="text-lg font-bold text-ib-primary">{service.price.toLocaleString()} Kz</span>
                  <div className="flex items-center gap-1">
                    <Link href={`/gestao/servicos/${service.id}/editar`} className="p-1.5 hover:bg-gray-100 rounded-lg text-ib-muted hover:text-ib-primary">
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDelete(service.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-ib-muted hover:text-ib-danger">
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
