"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Activity, Search, Info, AlertTriangle, Shield, UserCheck, Settings, Package, DollarSign, Users } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  userId: string | null;
  createdAt: string;
}

const actionIcons: Record<string, any> = {
  create: UserCheck,
  update: Settings,
  delete: AlertTriangle,
};

const entityIcons: Record<string, any> = {
  product: Package,
  customer: Users,
  sale: DollarSign,
  service: Activity,
  employee: Users,
};

export default function AdminLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/logs")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) =>
    (l.details || l.action || l.entity).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-6 h-6 text-ib-accent" />
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Logs do Sistema</h1>
          <p className="text-sm text-ib-muted">Registo de actividades e eventos da plataforma</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Filtrar actividades..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
        </div>
        {loading ? (
          <div className="p-12 text-center text-ib-muted">A carregar...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-ib-muted">Nenhum registo encontrado.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((log) => {
              const Icon = entityIcons[log.entity] || Activity;
              const isWarning = log.action === "delete";
              return (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isWarning ? "bg-red-50" : "bg-blue-50"}`}>
                    <Icon className={`w-4 h-4 ${isWarning ? "text-red-600" : "text-ib-accent"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ib-primary">{log.details || `${log.action} ${log.entity}`}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-ib-muted capitalize">{log.entity}</span>
                      <span className="text-xs text-ib-muted">•</span>
                      <span className="text-xs text-ib-muted">{new Date(log.createdAt).toLocaleString("pt-PT")}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${isWarning ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                    {log.action === "create" ? "Criação" : log.action === "delete" ? "Eliminação" : "Actualização"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
