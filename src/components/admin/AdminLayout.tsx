"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Building2, Wrench, Activity, Shield, LogOut, Home, ChevronLeft, ChevronRight, Globe, ArrowLeftFromLine, Settings, ToggleLeft, KeyRound, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const adminNav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin", desc: "Visão geral da plataforma" },
  { label: "Utilizadores", icon: Users, href: "/admin/usuarios", desc: "Gerir contas de utilizadores" },
  { label: "Empresas", icon: Building2, href: "/admin/empresas", desc: "Organizações registadas" },
  { label: "Recursos", icon: ToggleLeft, href: "/admin/recursos", desc: "Activar/desactivar funcionalidades" },
  { label: "Permissões", icon: KeyRound, href: "/admin/permissoes", desc: "Controlar acesso por tipo de conta" },
  { label: "Serviços", icon: Wrench, href: "/admin/servicos", desc: "Serviços da plataforma" },
  { label: "Conteúdos", icon: BookOpen, href: "/admin/conteudos", desc: "Vídeos, artigos, ebooks e posts" },
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
        "glass-sidebar flex flex-col shrink-0 transition-all duration-300 relative",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Logo */}
        <div className={cn("flex items-center border-b", collapsed ? "justify-center px-2 py-4" : "justify-between px-5 py-5")} style={{ borderColor: "var(--border-color)" }}>
          <Link href="/admin" className={cn("flex items-center", collapsed ? "" : "gap-2.5")}>
            {collapsed ? (
              <span className="font-bold text-xs" style={{ color: "var(--text-primary)" }}>IB+</span>
            ) : (
              <div>
                <div className="font-semibold text-sm leading-tight" style={{ color: "var(--text-primary)" }}>IBPlus+</div>
                <div className="text-[10px] text-ib-accent font-medium tracking-wider uppercase">Admin</div>
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
                    ? "bg-ib-accent/15 text-ib-accent font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-white/10"
                )}
                style={{ color: isActive ? "var(--color-ib-accent)" : "var(--text-muted)" }}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <div>
                    <div style={{ color: isActive ? "var(--color-ib-accent)" : "var(--text-primary)" }}>{item.label}</div>
                    <div className="text-[10px] leading-none mt-0.5" style={{ color: "var(--text-muted)" }}>{item.desc}</div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className={cn("border-t", collapsed ? "px-2 py-3 flex flex-col items-center" : "px-3 py-4 space-y-2")} style={{ borderColor: "var(--border-color)" }}>
          {!collapsed && (
            <div className="px-3 pb-2">
              <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user?.email}</div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>Administrador</div>
            </div>
          )}
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors",
              collapsed ? "justify-center p-2.5" : "px-3 py-2 w-full"
            )}
            style={{ color: "var(--text-muted)" }}
            title="Voltar à página inicial"
          >
            <Home className="w-4 h-4" />
            {!collapsed && "Página Inicial"}
          </Link>
          <button
            onClick={logout}
            className={cn(
              "flex items-center gap-2 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors",
              collapsed ? "justify-center p-2.5" : "px-3 py-2 w-full"
            )}
            style={{ color: "var(--text-muted)" }}
            title="Terminar sessão"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && "Terminar Sessão"}
          </button>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 glass-card rounded-full flex items-center justify-center shadow-sm z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" style={{ color: "var(--text-muted)" }} /> : <ChevronLeft className="w-3 h-3" style={{ color: "var(--text-muted)" }} />}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="glass-header sticky top-0 z-20 px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-ib-accent" />
            <div>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Administração da Plataforma</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-ib-accent/10 text-ib-accent font-medium">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
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
