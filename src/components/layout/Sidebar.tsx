"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  Warehouse,
  ShoppingCart,
  DollarSign,
  TrendingDown,
  BarChart3,
  FileText,
  Receipt,
  CreditCard,
  PiggyBank,
  PieChart,
  Target,
  Calendar,
  MessageSquare,
  Store,
  Image,
  Truck,
  Bot,
  LineChart,
  TrendingUp,
  Sparkles,
  Megaphone,
  Mail,
  Gift,
  Users2,
  Calculator,
  Sun,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

const modules: { name: string; items: NavItem[] }[] = [
  {
    name: "Gestão",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/gestao/dashboard" },
      { label: "Clientes", icon: Users, href: "/gestao/clientes" },
      { label: "Produtos", icon: Package, href: "/gestao/produtos" },
      { label: "Stock", icon: Warehouse, href: "/gestao/stock" },
      { label: "Compras", icon: ShoppingCart, href: "/gestao/compras" },
      { label: "Vendas", icon: DollarSign, href: "/gestao/vendas" },
      { label: "Despesas", icon: TrendingDown, href: "/gestao/despesas" },
      { label: "Fluxo de Caixa", icon: BarChart3, href: "/gestao/fluxo-caixa" },
    ],
  },
  {
    name: "Finance",
    items: [
      { label: "Faturação", icon: FileText, href: "/finance/faturacao" },
      { label: "Cobranças", icon: Receipt, href: "/finance/cobrancas" },
      { label: "Contas a Pagar", icon: CreditCard, href: "/finance/contas-pagar" },
      { label: "Contas a Receber", icon: PiggyBank, href: "/finance/contas-receber" },
      { label: "Relatórios", icon: PieChart, href: "/finance/relatorios" },
    ],
  },
  {
    name: "CRM",
    items: [
      { label: "Clientes", icon: Users, href: "/crm/clientes" },
      { label: "Funil de Vendas", icon: Target, href: "/crm/funil-vendas" },
      { label: "Propostas", icon: FileText, href: "/crm/propostas" },
      { label: "Agenda", icon: Calendar, href: "/crm/agenda" },
      { label: "Follow-up", icon: MessageSquare, href: "/crm/follow-up" },
    ],
  },
  {
    name: "Store",
    items: [
      { label: "Loja Online", icon: Store, href: "/store/loja" },
      { label: "Catálogo", icon: Image, href: "/store/catalogo" },
      { label: "Encomendas", icon: Truck, href: "/store/encomendas" },
      { label: "Pagamentos", icon: DollarSign, href: "/store/pagamentos" },
    ],
  },
  {
    name: "IA",
    items: [
      { label: "Assistente", icon: Bot, href: "/ia/assistente" },
      { label: "Análise de Vendas", icon: LineChart, href: "/ia/analise-vendas" },
      { label: "Previsões", icon: TrendingUp, href: "/ia/previsoes" },
      { label: "Recomendações", icon: Sparkles, href: "/ia/recomendacoes" },
      { label: "Relatórios", icon: PieChart, href: "/ia/relatorios" },
    ],
  },
  {
    name: "Marketing",
    items: [
      { label: "Campanhas", icon: Megaphone, href: "/marketing/campanhas" },
      { label: "E-mail Marketing", icon: Mail, href: "/marketing/email-marketing" },
      { label: "Promoções", icon: Gift, href: "/marketing/promocoes" },
      { label: "Fidelização", icon: Users, href: "/marketing/fidelizacao" },
    ],
  },
  {
    name: "RH",
    status: "coming-soon" as const,
    items: [
      { label: "Funcionários", icon: Users2, href: "/rh/funcionarios" },
      { label: "Salários", icon: Calculator, href: "/rh/salarios" },
      { label: "Férias", icon: Sun, href: "/rh/ferias" },
      { label: "Presenças", icon: Clock, href: "/rh/presencas" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-ib-primary text-white overflow-y-auto">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ib-accent font-bold text-lg">
          IB
        </div>
        <span className="font-semibold text-lg tracking-tight">
          IBPlus<sup className="text-ib-accent font-bold">+</sup>
        </span>
      </div>

      <nav className="px-3 py-4 space-y-6">
        {modules.map((mod) => (
          <div key={mod.name}>
            <div className="flex items-center gap-2 px-3 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-ib-muted">
                {mod.name}
              </span>
              {"status" in mod && mod.status === "coming-soon" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-ib-warning/20 text-ib-warning font-medium">
                  Breve
                </span>
              )}
            </div>
            <ul className="space-y-0.5">
              {mod.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive
                          ? "bg-ib-accent/20 text-ib-light font-medium"
                          : "text-ib-muted hover:text-white hover:bg-white/5"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
