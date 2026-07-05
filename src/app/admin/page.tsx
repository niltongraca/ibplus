"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Users, Building2, UserCircle, TrendingUp, Activity, Server, Wrench, ArrowRight, BarChart3, ShoppingCart, Globe, Shield } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalUsers: number;
  empresaCount: number;
  particularCount: number;
  totalCompanies: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setStats(d));
  }, []);

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ib-primary">Dashboard da Plataforma</h1>
        <p className="text-sm text-ib-muted mt-1">Visão geral do ecossistema IBPlus+</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: "Utilizadores", value: stats?.totalUsers ?? "-,---", sub: "Total registados", color: "text-blue-600 bg-blue-50", border: "border-blue-100" },
          { icon: Building2, label: "Empresas", value: stats?.empresaCount ?? "-", sub: "Contas empresariais", color: "text-emerald-600 bg-emerald-50", border: "border-emerald-100" },
          { icon: UserCircle, label: "Particulares", value: stats?.particularCount ?? "-", sub: "Contas individuais", color: "text-violet-600 bg-violet-50", border: "border-violet-100" },
          { icon: Globe, label: "Organizações", value: stats?.totalCompanies ?? "-", sub: "Entidades registadas", color: "text-amber-600 bg-amber-50", border: "border-amber-100" },
        ].map((s) => (
          <div key={s.label} className={`bg-white border ${s.border} rounded-xl p-5 hover:shadow-sm transition-shadow`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}>
                <s.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-semibold ${s.color.split(" ")[0]}`}>{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-ib-primary">{s.value}</p>
            <p className="text-xs text-ib-muted mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Server className="w-5 h-5 text-ib-accent" />
            <h2 className="font-semibold text-ib-primary">Gestão da Plataforma</h2>
          </div>
          <div className="space-y-2">
            {[
              { icon: Users, label: "Utilizadores", desc: "Gerir contas, permissões e estados", href: "/admin/usuarios", color: "text-blue-600" },
              { icon: Building2, label: "Empresas", desc: "Visualizar e administrar organizações", href: "/admin/empresas", color: "text-emerald-600" },
              { icon: Wrench, label: "Serviços", desc: "Configurar serviços disponíveis", href: "/admin/servicos", color: "text-purple-600" },
              { icon: Activity, label: "Logs do Sistema", desc: "Auditar actividades da plataforma", href: "/admin/logs", color: "text-orange-600" },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className={`w-9 h-9 rounded-lg ${item.color.replace("text-", "bg-")} bg-opacity-10 flex items-center justify-center shrink-0`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ib-primary text-sm">{item.label}</p>
                  <p className="text-xs text-ib-muted truncate">{item.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-ib-muted group-hover:text-ib-accent transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-ib-accent" />
            <h2 className="font-semibold text-ib-primary">Resumo do Sistema</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-ib-accent" />
                <span className="text-sm text-ib-primary">Administradores</span>
              </div>
              <span className="text-sm font-bold text-ib-primary">1</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-ib-primary">Empresas registadas</span>
              </div>
              <span className="text-sm font-bold text-ib-primary">{stats?.empresaCount ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-ib-primary">Total utilizadores</span>
              </div>
              <span className="text-sm font-bold text-ib-primary">{stats?.totalUsers ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-ib-primary">Estado da plataforma</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="bg-gradient-to-r from-ib-accent/5 to-blue-50 border border-blue-100 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-ib-accent/10 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-ib-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-ib-primary text-sm mb-1">Painel de Administração IBPlus+</h3>
            <p className="text-sm text-ib-muted">
              Este painel permite gerir toda a plataforma IBPlus+, incluindo utilizadores, empresas e serviços.
              As alterações feitas aqui afectam o sistema global.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
