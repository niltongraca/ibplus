"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Shield, Check, X, Search } from "lucide-react";

interface Permission {
  id: string;
  accountType: string;
  allowed: boolean;
  resource: { key: string; label: string };
}

const ACCOUNT_TYPES = ["EMPREENDEDOR", "EMPRESA", "ONG", "ASSOCIACAO", "EDUCACAO", "COOPERATIVA"];
const TYPE_LABELS: Record<string, string> = {
  EMPREENDEDOR: "Empreendedor",
  EMPRESA: "Empresa",
  ONG: "ONG",
  ASSOCIACAO: "Associação",
  EDUCACAO: "Educação",
  COOPERATIVA: "Cooperativa",
};

const TYPE_COLORS: Record<string, string> = {
  EMPREENDEDOR: "bg-violet-100 text-violet-700",
  EMPRESA: "bg-blue-100 text-blue-700",
  ONG: "bg-emerald-100 text-emerald-700",
  ASSOCIACAO: "bg-amber-100 text-amber-700",
  EDUCACAO: "bg-rose-100 text-rose-700",
  COOPERATIVA: "bg-cyan-100 text-cyan-700",
};

export default function AdminPermissoes() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchPermissions = () => {
    fetch("/api/admin/resources/permissions")
      .then((r) => r.json())
      .then((d) => setPermissions(d.permissions));
  };

  useEffect(() => { fetchPermissions(); }, []);

  const togglePermission = async (perm: Permission) => {
    setSavingId(perm.id);
    setError("");
    try {
      const r = await fetch("/api/admin/resources/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: perm.id, allowed: !perm.allowed }),
      });
      if (!r.ok) throw new Error("Erro ao actualizar");
      setPermissions((prev) => prev.map((p) => (p.id === perm.id ? { ...p, allowed: !p.allowed } : p)));
    } catch {
      setError("Erro ao alterar permissão.");
    } finally {
      setSavingId(null);
    }
  };

  // Group permissions by resource
  const resourceKeys = [...new Set(permissions.map((p) => p.resource.key))];
  const filteredKeys = resourceKeys.filter((key) => {
    const resource = permissions.find((p) => p.resource.key === key)?.resource;
    return resource?.label.toLowerCase().includes(search.toLowerCase()) || key.toLowerCase().includes(search.toLowerCase());
  });

  const getPerm = (resourceKey: string, accountType: string) =>
    permissions.find((p) => p.resource.key === resourceKey && p.accountType === accountType);

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-ib-accent" />
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Permissões</h1>
          <p className="text-sm text-ib-muted">Controlar acesso a recursos por tipo de conta</p>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Pesquisar recursos..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-ib-muted text-left">
                <th className="p-4 font-medium">Recurso</th>
                {ACCOUNT_TYPES.map((type) => (
                  <th key={type} className="p-4 font-medium text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${TYPE_COLORS[type]}`}>
                      {TYPE_LABELS[type]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredKeys.map((resourceKey) => {
                const resource = permissions.find((p) => p.resource.key === resourceKey)?.resource;
                return (
                  <tr key={resourceKey} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-ib-primary">{resource?.label || resourceKey}</td>
                    {ACCOUNT_TYPES.map((type) => {
                      const perm = getPerm(resourceKey, type);
                      if (!perm) return <td key={type} className="p-4 text-center text-ib-muted">—</td>;
                      return (
                        <td key={type} className="p-4 text-center">
                          <button
                            onClick={() => togglePermission(perm)}
                            disabled={savingId === perm.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              savingId === perm.id ? "opacity-50 cursor-wait" :
                              perm.allowed
                                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            }`}
                          >
                            {perm.allowed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            {perm.allowed ? "Permitido" : "Negado"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {filteredKeys.length === 0 && (
                <tr><td colSpan={7} className="p-12 text-center text-ib-muted">Nenhum recurso encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
