"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit3, Trash2, Users } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { useToast } from "@/components/Toast";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  nif: string | null;
  type: string;
  _count?: { sales: number };
}

export default function ClientesPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers))
      .catch((err) => console.error("Erro ao carregar clientes:", err))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Eliminar cliente?")) return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Cliente eliminado com sucesso!");
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } else {
      toast("Erro ao eliminar cliente.", "error");
    }
  }

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Clientes</h1>
          <p className="text-ib-muted text-sm">Gerir base de clientes</p>
        </div>
        <Link
          href="/gestao/clientes/novo"
          className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Novo Cliente
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar clientes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>
        </div>

        <DataTable
          columns={[
            { key: "name", header: "Nome", render: (c) => (
              <Link href={`/gestao/clientes/${c.id}`} className="font-medium text-ib-primary hover:text-ib-accent">
                {c.name}
              </Link>
            )},
            { key: "email", header: "Email", hide: "tablet", render: (c) => <span className="text-ib-muted">{c.email || "—"}</span> },
            { key: "phone", header: "Telefone", hide: "mobile", render: (c) => <span className="text-ib-muted">{c.phone || "—"}</span> },
            { key: "nif", header: "NIF", hide: "tablet", render: (c) => <span className="text-ib-muted">{c.nif || "—"}</span> },
            { key: "type", header: "Tipo", hide: "mobile", className: "text-center", render: (c) => (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.type === "empresa" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                {c.type === "empresa" ? "Empresa" : "Particular"}
              </span>
            )},
            { key: "actions", header: "Acções", hide: "mobile", className: "text-right", render: (c) => (
              <div className="flex items-center justify-end gap-1">
                <Link href={`/gestao/clientes/${c.id}/editar`} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit3 className="w-4 h-4 text-ib-muted" /></Link>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
              </div>
            )},
          ]}
          data={filtered}
          loading={loading}
          emptyIcon={<Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhum cliente encontrado."
          keyExtractor={(c) => c.id}
          mobileCard={(c) => (
            <Link href={`/gestao/clientes/${c.id}`}>
              <div className="flex items-start justify-between mb-3">
                <p className="font-semibold text-ib-primary">{c.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.type === "empresa" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                  {c.type === "empresa" ? "Empresa" : "Particular"}
                </span>
              </div>
              <div className="text-sm text-ib-muted space-y-0.5">
                {c.email && <p>{c.email}</p>}
                {c.phone && <p>{c.phone}</p>}
              </div>
            </Link>
          )}
        />
      </div>
    </div>
  );
}
