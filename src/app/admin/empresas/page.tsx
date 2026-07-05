"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Building2, Search, Mail, FileText } from "lucide-react";

interface EmpresaUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  companyId: string | null;
  company: { id: string; name: string; nif: string | null; email: string | null } | null;
  companyProfile: { nomeEmpresa: string | null; nif: string | null; registoComercial: string | null } | null;
  _count: { products: number; customers: number; sales: number };
}

export default function AdminEmpresas() {
  const [empresas, setEmpresas] = useState<EmpresaUser[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/empresas")
      .then((r) => r.json())
      .then((d) => setEmpresas(d.empresas));
  }, []);

  const filtered = empresas.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.email && e.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6 text-ib-accent" />
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Empresas</h1>
          <p className="text-sm text-ib-muted">Organizações e empresas registadas na plataforma</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Pesquisar empresas..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
          <span className="text-xs text-ib-muted">{filtered.length} empresa{filtered.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-ib-muted text-left">
                <th className="p-4 font-medium">Empresa</th>
                <th className="p-4 font-medium">NIF</th>
                <th className="p-4 font-medium">Contacto</th>
                <th className="p-4 font-medium text-center">Utilizadores</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const companyName = e.company?.name || e.companyProfile?.nomeEmpresa || e.name;
                const nif = e.companyProfile?.nif || e.company?.nif;
                return (
                <tr key={e.id} className="border-b border-gray-50 text-ib-primary hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs shrink-0">{companyName.charAt(0)}</div>
                      <div>
                        <span className="font-medium">{companyName}</span>
                        <p className="text-xs text-ib-muted">{e.companyProfile?.nomeEmpresa || e.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-ib-muted font-mono text-sm">{nif || "—"}</td>
                  <td className="p-4">
                    {e.email && (
                      <span className="flex items-center gap-1.5 text-ib-muted">
                        <Mail className="w-3 h-3" /> {e.email}
                      </span>
                    )}
                    {!e.email && <span className="text-ib-muted">—</span>}
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      <FileText className="w-3 h-3" /> {e._count.products} produtos
                    </span>
                  </td>
                </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="p-12 text-center text-ib-muted">Nenhuma empresa encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
