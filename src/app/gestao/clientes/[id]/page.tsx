"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Trash2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Sale {
  id: string;
  date: string;
  total: number;
  status: string;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  nif: string | null;
  address: string | null;
  type: string;
  notes: string | null;
  createdAt: string;
  sales: Sale[];
}

export default function ClienteDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((d) => setCustomer(d.customer))
      .catch(() => router.push("/gestao/clientes"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleDelete() {
    if (!confirm("Eliminar cliente?")) return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Cliente eliminado com sucesso!");
      router.push("/gestao/clientes");
    } else {
      toast("Erro ao eliminar cliente.", "error");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-ib-muted text-sm">A carregar...</div>
      </div>
    );
  }

  if (!customer) return null;

  const totalCompras = customer.sales.reduce((sum, s) => sum + s.total, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/gestao/clientes" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-ib-muted" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ib-primary">{customer.name}</h1>
            <p className="text-ib-muted text-sm">Detalhes do cliente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/gestao/clientes/${id}/editar`}
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
                <span className="text-ib-primary font-medium">{customer.name}</span>
              </div>
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Tipo</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block ${customer.type === "empresa" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                  {customer.type === "empresa" ? "Empresa" : "Particular"}
                </span>
              </div>
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Email</span>
                <span className="text-ib-primary">{customer.email || "—"}</span>
              </div>
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Telefone</span>
                <span className="text-ib-primary">{customer.phone || "—"}</span>
              </div>
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">NIF</span>
                <span className="text-ib-primary">{customer.nif || "—"}</span>
              </div>
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Cliente desde</span>
                <span className="text-ib-muted text-sm">{formatDate(customer.createdAt)}</span>
              </div>
              {customer.address && (
                <div className="sm:col-span-2">
                  <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Morada</span>
                  <span className="text-ib-primary">{customer.address}</span>
                </div>
              )}
              {customer.notes && (
                <div className="sm:col-span-2">
                  <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Notas</span>
                  <span className="text-ib-primary">{customer.notes}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-ib-primary mb-4">Histórico de Compras</h2>
            {customer.sales.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-ib-muted text-sm">Nenhuma compra registada.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-ib-muted text-xs uppercase tracking-wider">
                      <th className="text-left p-3 font-medium">Data</th>
                      <th className="text-right p-3 font-medium">Total</th>
                      <th className="text-center p-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.sales.map((sale) => (
                      <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="p-3 text-ib-primary">{formatDate(sale.date)}</td>
                        <td className="p-3 text-right font-semibold">{formatCurrency(sale.total)}</td>
                        <td className="p-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            sale.status === "completed" ? "bg-green-100 text-green-700" :
                            sale.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-500"
                          }`}>
                            {sale.status === "completed" ? "Concluída" : sale.status === "pending" ? "Pendente" : sale.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-ib-primary mb-4">Resumo</h2>
            <div className="space-y-4">
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Total de Compras</span>
                <span className="text-2xl font-bold text-ib-primary">{formatCurrency(totalCompras)}</span>
              </div>
              <div>
                <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Nº de Compras</span>
                <span className="text-2xl font-bold text-ib-primary">{customer.sales.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
