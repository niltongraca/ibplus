"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Building2, Wrench, Activity, Shield, LogOut, Home, ChevronLeft, ChevronRight, Globe, ArrowLeftFromLine, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const adminNav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin", desc: "Visão geral da plataforma" },
  { label: "Utilizadores", icon: Users, href: "/admin/usuarios", desc: "Gerir contas de utilizadores" },
  { label: "Empresas", icon: Building2, href: "/admin/empresas", desc: "Organizações registadas" },
  { label: "Serviços", icon: Wrench, href: "/admin/servicos", desc: "Serviços da plataforma" },
  { label: "Logs", icon: Activity, href: "/admin/logs", desc: "Registo de actividades" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-10 rounded-2xl border border-gray-200 shadow-lg max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6 border-2 border-red-100">
            <Shield className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-ib-primary mb-2">Acesso Restrito</h1>
          <p className="text-ib-muted mb-6">Esta área é exclusiva para administradores da plataforma IBPlus+.</p>
          <Link href="/gestao/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-ib-accent/90 transition-colors shadow-sm">
            <ArrowLeftFromLine className="w-4 h-4" /> Voltar ao Painel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={cn(
        "bg-ib-primary flex flex-col shrink-0 transition-all duration-300 relative",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Logo */}
        <div className={cn("flex items-center border-b border-white/10", collapsed ? "justify-center px-2 py-4" : "justify-between px-5 py-5")}>
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-ib-accent flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-sm">IB</div>
            {!collapsed && (
              <div>
                <div className="font-semibold text-white text-sm leading-tight">IBPlus+</div>
                <div className="text-[10px] text-blue-300 font-medium tracking-wider uppercase">Admin</div>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {adminNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm transition-colors group",
                  collapsed ? "justify-center p-2.5" : "px-3 py-2.5",
                  isActive
                    ? "bg-ib-accent/20 text-white font-medium"
                    : "text-blue-200/70 hover:text-white hover:bg-white/5"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-ib-accent" : "")} />
                {!collapsed && (
                  <div>
                    <div className={isActive ? "text-white" : ""}>{item.label}</div>
                    <div className="text-[10px] opacity-60 leading-none mt-0.5">{item.desc}</div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className={cn("border-t border-white/10", collapsed ? "px-2 py-3 flex flex-col items-center" : "px-3 py-4 space-y-2")}>
          {!collapsed && (
            <div className="px-3 pb-2">
              <div className="text-xs text-blue-300/60 truncate">{user?.email}</div>
              <div className="text-[10px] text-blue-300/40">Administrador</div>
            </div>
          )}
          <Link
            href="/gestao/dashboard"
            className={cn(
              "flex items-center gap-2 text-sm text-blue-200/60 hover:text-white rounded-lg hover:bg-white/5 transition-colors",
              collapsed ? "justify-center p-2.5" : "px-3 py-2 w-full"
            )}
            title="Ir para o painel da empresa"
          >
            <Home className="w-4 h-4" />
            {!collapsed && "Painel Principal"}
          </Link>
          <button
            onClick={logout}
            className={cn(
              "flex items-center gap-2 text-sm text-blue-200/60 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-colors",
              collapsed ? "justify-center p-2.5" : "px-3 py-2 w-full"
            )}
            title="Terminar sessão"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && "Terminar Sessão"}
          </button>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3 text-ib-muted" /> : <ChevronLeft className="w-3 h-3 text-ib-muted" />}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-ib-accent" />
            <div>
              <span className="text-sm font-medium text-ib-primary">Administração da Plataforma</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-ib-accent/10 text-ib-accent font-medium">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-ib-muted">
            <Settings className="w-3.5 h-3.5" />
            <span>IBPlus+ v0.1</span>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
