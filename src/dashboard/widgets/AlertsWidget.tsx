"use client";

import { AlertTriangle, Clock, FileText, PackageX } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { DashboardData } from "../DashboardRenderer";

export function AlertsWidget({ data }: { data: DashboardData | null }) {
  if (!data) return null;

  const alerts: { icon: any; label: string; value: string; href: string; box: string; iconColor: string }[] = [];

  if (data.lowStockProducts.length > 0) {
    alerts.push({
      icon: PackageX,
      label: "Stock Baixo",
      value: `${data.lowStockProducts.length} produto(s) com stock crítico`,
      href: "/gestao/stock",
      box: "bg-orange-100/70",
      iconColor: "text-orange-500",
    });
  }

  if (data.pendingInvoices > 0) {
    alerts.push({
      icon: FileText,
      label: "Faturas Pendentes",
      value: `${data.pendingInvoices} fatura(s) — ${formatCurrency(data.pendingInvoicesTotal)}`,
      href: "/finance/faturacao",
      box: "bg-blue-100/70",
      iconColor: "text-blue-500",
    });
  }

  if (data.pendingQuotes > 0) {
    alerts.push({
      icon: FileText,
      label: "Orçamentos Pendentes",
      value: `${data.pendingQuotes} orçamento(s) — ${formatCurrency(data.pendingQuotesTotal)}`,
      href: "/finance/orcamentos",
      box: "bg-purple-100/70",
      iconColor: "text-purple-500",
    });
  }

  if (data.vacationPending > 0) {
    alerts.push({
      icon: Clock,
      label: "Férias Pendentes",
      value: `${data.vacationPending} pedido(s) de férias`,
      href: "/rh/ferias",
      box: "bg-yellow-100/70",
      iconColor: "text-yellow-600",
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-orange-500" />
        Alertas
      </h3>
      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <Link key={i} href={alert.href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <div className={`w-10 h-10 rounded-full ${alert.box} flex items-center justify-center flex-shrink-0`}>
              <alert.icon className={`w-4 h-4 ${alert.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{alert.label}</p>
              <p className="text-xs text-gray-500 truncate">{alert.value}</p>
            </div>
            <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Ver</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
