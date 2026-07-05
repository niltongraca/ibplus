"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Wrench, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  price: number;
  description: string | null;
  duration: string | null;
  active: boolean;
}

export default function AdminServicos() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setServices(d.services));
  }, []);

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Wrench className="w-6 h-6 text-ib-accent" />
          <div>
            <h1 className="text-2xl font-bold text-ib-primary">Serviços da Plataforma</h1>
            <p className="text-sm text-ib-muted">Serviços disponíveis para as empresas na plataforma</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Pesquisar serviços..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filtered.map((s) => (
            <div key={s.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ib-primary text-sm truncate">{s.name}</p>
                  {s.duration && <p className="text-xs text-ib-muted">{s.duration}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {s.active ? "Activo" : "Inactivo"}
                </span>
              </div>
              {s.description && <p className="text-xs text-ib-muted mb-3 line-clamp-2">{s.description}</p>}
              <p className="text-lg font-bold text-ib-accent">{formatCurrency(s.price)}</p>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full p-12 text-center text-ib-muted">Nenhum serviço encontrado.</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
