"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Trash2, Wrench } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ServicoDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/services/${id}`)
      .then((r) => r.json())
      .then((d) => setService(d.service))
      .catch(() => router.push("/gestao/servicos"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleDelete() {
    if (!(await confirm({ title: "Eliminar serviço", message: "Tem a certeza que deseja eliminar este serviço?", variant: "danger" }))) return;
    const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Serviço eliminado com sucesso!");
      router.push("/gestao/servicos");
    } else {
      toast("Erro ao eliminar serviço.", "error");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10" />
          <div><Skeleton className="w-48 h-7 mb-1" /><Skeleton className="w-32 h-4" /></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><Skeleton className="h-48" /></div>
          <div><Skeleton className="h-40" /></div>
        </div>
      </div>
    );
  }

  if (!service) {
    return <EmptyState title="Serviço não encontrado" description="O serviço que procura não existe ou foi removido." actionLabel="Voltar" actionHref="/gestao/servicos" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/gestao/servicos" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-ib-muted" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ib-primary">{service.name}</h1>
            <p className="text-ib-muted text-sm">Detalhes do serviço</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/gestao/servicos/${id}/editar`}
            className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-ib-primary px-4 py-2.5 rounded-lg text-sm font-medium"
          >
            <Edit3 className="w-4 h-4" /> Editar
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 border border-red-200 hover:bg-red-50 text-red-600 px-4 py-2.5 rounded-lg text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" /> Eliminar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-ib-primary mb-4">Informação Geral</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Nome</span>
                <span className="text-ib-primary font-medium">{service.name}</span>
              </div>
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Duração</span>
                <span className="text-ib-primary">{service.duration || "—"}</span>
              </div>
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Estado</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${service.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                  {service.active ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Tipo</span>
                <span className="flex items-center gap-1 text-ib-primary"><Wrench className="w-3.5 h-3.5 text-ib-accent" /> Serviço</span>
              </div>
              {service.description && (
                <div className="sm:col-span-2">
                  <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Descrição</span>
                  <span className="text-ib-primary">{service.description}</span>
                </div>
              )}
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Criado em</span>
                <span className="text-ib-muted text-sm">{formatDate(service.createdAt)}</span>
              </div>
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Actualizado em</span>
                <span className="text-ib-muted text-sm">{formatDate(service.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-ib-primary mb-4">Preço</h2>
            <div className="space-y-4">
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Preço do Serviço</span>
                <span className="text-2xl font-bold text-ib-primary">{formatCurrency(service.price)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
