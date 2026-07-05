"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, Bell, LogOut, Shield } from "lucide-react";

const moduleNames: Record<string, string> = {
  gestao: "Gestão",
  finance: "Finance",
  crm: "CRM",
  store: "Store",
  ia: "IA",
  marketing: "Marketing",
  rh: "RH",
};

const pageNames: Record<string, string> = {
  "gestao/dashboard": "Dashboard",
  "gestao/clientes": "Clientes",
  "gestao/produtos": "Produtos",
  "gestao/stock": "Stock",
  "gestao/compras": "Compras",
  "gestao/vendas": "Vendas",
  "gestao/despesas": "Despesas",
  "gestao/fluxo-caixa": "Fluxo de Caixa",
  "finance/faturacao": "Faturação",
  "finance/orcamentos": "Orçamentos",
  "finance/cobrancas": "Cobranças",
  "finance/contas-pagar": "Contas a Pagar",
  "finance/contas-receber": "Contas a Receber",
  "finance/relatorios": "Relatórios",
  "crm/clientes": "Clientes",
  "crm/funil-vendas": "Funil de Vendas",
  "crm/propostas": "Propostas",
  "crm/agenda": "Agenda",
  "crm/follow-up": "Follow-up",
  "store/loja": "Loja Online",
  "store/catalogo": "Catálogo",
  "store/encomendas": "Encomendas",
  "store/pagamentos": "Pagamentos",
  "ia/assistente": "Assistente",
  "ia/analise-vendas": "Análise de Vendas",
  "ia/previsoes": "Previsões",
  "ia/recomendacoes": "Recomendações",
  "ia/relatorios": "Relatórios",
  "marketing/campanhas": "Campanhas",
  "marketing/email-marketing": "E-mail Marketing",
  "marketing/promocoes": "Promoções",
  "marketing/fidelizacao": "Fidelização",
  "rh/funcionarios": "Funcionários",
  "rh/salarios": "Salários",
  "rh/ferias": "Férias",
  "rh/presencas": "Presenças",
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const segments = (pathname || "").split("/").filter(Boolean);
  const moduleKey = segments[0] || "";
  const pageKey = segments.join("/");
  const moduleName = moduleNames[moduleKey] || "";
  const pageName = pageNames[pageKey] || "";

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5 text-ib-primary" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-ib-primary truncate">
              {moduleName ? `${moduleName}${pageName ? ` — ${pageName}` : ""}` : "IBPlus"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Notificações">
            <Bell className="w-5 h-5 text-ib-muted" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-ib-danger rounded-full" />
          </button>

          {user && (
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200">
              {user.role === "admin" && (
                <Link href="/gestao/admin" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-medium hover:bg-amber-500/20 transition-colors" title="Painel Admin">
                  <Shield className="w-3.5 h-3.5" /> Admin
                </Link>
              )}
              <div className="w-8 h-8 rounded-lg bg-ib-accent/10 flex items-center justify-center text-sm font-bold text-ib-accent">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-ib-primary leading-tight">{user.name}</p>
                <p className="text-xs text-ib-muted">{user.email}</p>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Sair"
          >
            <LogOut className="w-5 h-5 text-ib-muted hover:text-ib-danger transition-colors" />
          </button>
        </div>
      </div>
    </header>
  );
}
