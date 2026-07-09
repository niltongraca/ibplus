"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, LogOut, Shield, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import NotificationBell from "@/components/NotificationBell";

const pageNames: Record<string, string> = {
  "gestao/dashboard": "Dashboard",
  "gestao/clientes": "Clientes",
  "gestao/produtos": "Produtos",
  "gestao/servicos": "Serviços",
  "gestao/stock": "Stock",
  "gestao/compras": "Compras",
  "gestao/vendas": "Vendas",
  "gestao/despesas": "Despesas",
  "gestao/fluxo-caixa": "Fluxo de Caixa",
  "gestao/perfil": "Perfil",
  "crm/funil-vendas": "Funil de Vendas",
  "ia/assistente": "Assistente",
  "ia/recomendacoes": "Recomendações",
  "rh/funcionarios": "Funcionários",
  "marketing/campanhas": "Campanhas",
  "educacao/alunos": "Alunos",
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname() ?? "";
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  const segments = (pathname || "").split("/").filter(Boolean);
  const pageKey = segments.slice(0, 2).join("/");
  const pageName = pageNames[pageKey] || "";

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-card)] border-b border-[var(--border-color)]">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate" style={{ color: "var(--text-primary)" }}>
              {pageName || "IBPlus"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggle}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Alternar tema"
            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-ib-muted" />}
          </button>

          <NotificationBell />

          {user && (
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-[var(--border-color)]">
              {user.role === "admin" && (
                <Link href="/admin" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-medium hover:bg-amber-500/20 transition-colors" title="Painel Admin">
                  <Shield className="w-3.5 h-3.5" /> Admin
                </Link>
              )}
              <div className="w-8 h-8 rounded-lg bg-ib-accent/10 flex items-center justify-center text-sm font-bold text-ib-accent">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-medium leading-tight" style={{ color: "var(--text-primary)" }}>{user.name}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{user.email}</p>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Sair"
          >
            <LogOut className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>
      </div>
    </header>
  );
}
