"use client";

import { useEffect, useState } from "react";
import { Users, Search, Phone, Mail, ShoppingCart, Calendar } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  nif: string | null;
  type: string;
  createdAt: string;
  _count?: { sales: number };
}

export default function CrmClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-12 text-center text-ib-muted">A carregar...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">CRM — Clientes</h1>
          <p className="text-ib-muted text-sm">Gestão avançada de clientes com histórico</p>
        </div>
        <Link href="/gestao/clientes/novo" className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
          <Users className="w-4 h-4" /> Novo Cliente
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Pesquisar clientes..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-ib-muted">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link href={`/gestao/clientes/${c.id}`} className="font-semibold text-ib-primary hover:text-ib-accent">
                    {c.name}
                  </Link>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${c.type === "empresa" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                    {c.type === "empresa" ? "Empresa" : "Particular"}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-ib-muted">
                {c.phone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {c.phone}</p>}
                {c.email && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {c.email}</p>}
                <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {formatDate(c.createdAt)}</p>
                <p className="flex items-center gap-2"><ShoppingCart className="w-3.5 h-3.5" /> {c._count?.sales ?? 0} compras</p>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                <Link href={`/gestao/clientes/${c.id}`} className="text-xs text-ib-accent hover:text-blue-700 font-medium">Perfil</Link>
                <Link href={`/gestao/clientes/${c.id}/editar`} className="text-xs text-ib-muted hover:text-ib-primary">Editar</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
