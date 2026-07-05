"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Activity, Search, Shield, AlertTriangle, Info, UserCheck, Settings } from "lucide-react";

const mockLogs = [
  { action: "Novo utilizador registado", user: "sistema", date: "2026-07-05 09:15", type: "info", icon: UserCheck },
  { action: "Empresa actualizada: Tech Solutions Lda", user: "admin@ibplus.co.ao", date: "2026-07-05 08:45", type: "info", icon: Settings },
  { action: "Tentativa de login inválida", user: "joao@email.com", date: "2026-07-05 08:30", type: "warning", icon: AlertTriangle },
  { action: "Serviço removido: Consultoria Premium", user: "admin@ibplus.co.ao", date: "2026-07-04 16:30", type: "warning", icon: Activity },
  { action: "Nova empresa registada", user: "sistema", date: "2026-07-04 14:20", type: "info", icon: Shield },
  { action: "Password alterada com sucesso", user: "maria@empresa.co.ao", date: "2026-07-04 11:05", type: "info", icon: Info },
  { action: "Administrador promovido", user: "admin@ibplus.co.ao", date: "2026-07-03 10:00", type: "info", icon: Shield },
  { action: "Exportação de relatório", user: "carlos@loja.co.ao", date: "2026-07-03 09:30", type: "info", icon: Info },
];

const typeStyles: Record<string, string> = {
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
  error: "bg-red-50 text-red-700 border-red-200",
};

const typeLabels: Record<string, string> = {
  info: "Informação",
  warning: "Aviso",
  error: "Erro",
};

export default function AdminLogs() {
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
            <input type="text" placeholder="Filtrar actividades..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {mockLogs.map((log, i) => {
            const Icon = log.icon;
            return (
              <div key={i} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  log.type === "warning" ? "bg-yellow-50" : "bg-blue-50"
                }`}>
                  <Icon className={`w-4 h-4 ${log.type === "warning" ? "text-yellow-600" : "text-ib-accent"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ib-primary">{log.action}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-ib-muted">{log.user}</span>
                    <span className="text-xs text-ib-muted">•</span>
                    <span className="text-xs text-ib-muted">{log.date}</span>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${typeStyles[log.type] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  {typeLabels[log.type] || log.type}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
