"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Users, Search, Mail, Calendar, Shield } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  accountType: string;
  plan: string;
  role: string;
  createdAt: string;
}

const typeStyles: Record<string, string> = {
  EMPREENDEDOR: "bg-violet-50 text-violet-700 border-violet-200",
  EMPRESA: "bg-blue-50 text-blue-700 border-blue-200",
  ONG: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ASSOCIACAO: "bg-amber-50 text-amber-700 border-amber-200",
  EDUCACAO: "bg-rose-50 text-rose-700 border-rose-200",
  COOPERATIVA: "bg-cyan-50 text-cyan-700 border-cyan-200",
};

const typeLabels: Record<string, string> = {
  EMPREENDEDOR: "Empreendedor",
  EMPRESA: "Empresa",
  ONG: "ONG",
  ASSOCIACAO: "Associação",
  EDUCACAO: "Educação",
  COOPERATIVA: "Cooperativa",
};

const planStyles: Record<string, string> = {
  FREE: "bg-gray-50 text-gray-600 border-gray-200",
  PREMIUM: "bg-amber-50 text-amber-700 border-amber-200",
  BUSINESS: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function AdminUsuarios() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/usuarios")
      .then((r) => r.json())
      .then((d) => setUsers(d.users));
  }, []);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-ib-accent" />
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Utilizadores</h1>
          <p className="text-sm text-ib-muted">Todos os utilizadores registados na plataforma IBPlus+</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Pesquisar utilizadores..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
          <span className="text-xs text-ib-muted">{filtered.length} utilizador{filtered.length !== 1 ? "es" : ""}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-ib-muted text-left">
                <th className="p-4 font-medium">Utilizador</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Tipo de Conta</th>
                <th className="p-4 font-medium">Registo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 text-ib-primary hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        u.role === "admin" ? "bg-amber-50 text-amber-600" :
                        typeStyles[u.accountType]?.split(" ")[0] || "bg-gray-50 text-gray-600"
                      }`}>{u.name.charAt(0)}</div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{u.name}</span>
                        {u.role === "admin" && <Shield className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1.5 text-ib-muted">
                      <Mail className="w-3 h-3" /> {u.email}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${typeStyles[u.accountType] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                        {typeLabels[u.accountType] || u.accountType}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${planStyles[u.plan] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                        {u.plan}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-ib-muted text-sm">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> {new Date(u.createdAt).toLocaleDateString("pt-AO")}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="p-12 text-center text-ib-muted">Nenhum utilizador encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
