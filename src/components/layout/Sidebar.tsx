"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Settings,
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
  ScrollText,
  Shield,
  X,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  resourceKey?: string;
}

interface ModuleGroup {
  name: string;
  items: NavItem[];
  status?: "coming-soon";
}

const modules: ModuleGroup[] = [
  {
    name: "Gestão",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/gestao/dashboard", resourceKey: "dashboard" },
      { label: "Clientes", icon: Users, href: "/gestao/clientes", resourceKey: "clientes" },
      { label: "Produtos", icon: Package, href: "/gestao/produtos", resourceKey: "produtos" },
      { label: "Serviços", icon: FileText, href: "/gestao/servicos", resourceKey: "servicos" },
      { label: "Stock", icon: Warehouse, href: "/gestao/stock", resourceKey: "stock" },
      { label: "Compras", icon: ShoppingCart, href: "/gestao/compras", resourceKey: "compras" },
      { label: "Vendas", icon: DollarSign, href: "/gestao/vendas", resourceKey: "vendas" },
      { label: "Despesas", icon: TrendingDown, href: "/gestao/despesas", resourceKey: "despesas" },
      { label: "Fluxo de Caixa", icon: BarChart3, href: "/gestao/fluxo-caixa", resourceKey: "fluxo-caixa" },
      { label: "Perfil", icon: Settings, href: "/gestao/perfil" },
    ],
  },
  {
    name: "Finance",
    items: [
      { label: "Faturação", icon: FileText, href: "/finance/faturacao", resourceKey: "faturacao" },
      { label: "Orçamentos", icon: ScrollText, href: "/finance/orcamentos", resourceKey: "orcamentos" },
      { label: "Cobranças", icon: Receipt, href: "/finance/cobrancas", resourceKey: "cobrancas" },
      { label: "Contas a Pagar", icon: CreditCard, href: "/finance/contas-pagar", resourceKey: "contas-pagar" },
      { label: "Contas a Receber", icon: PiggyBank, href: "/finance/contas-receber", resourceKey: "contas-receber" },
      { label: "Relatórios", icon: PieChart, href: "/finance/relatorios", resourceKey: "relatorios" },
    ],
  },
  {
    name: "CRM",
    items: [
      { label: "Clientes", icon: Users, href: "/crm/clientes", resourceKey: "crm" },
      { label: "Funil de Vendas", icon: Target, href: "/crm/funil-vendas", resourceKey: "crm" },
      { label: "Propostas", icon: FileText, href: "/crm/propostas", resourceKey: "crm" },
      { label: "Agenda", icon: Calendar, href: "/crm/agenda", resourceKey: "crm" },
      { label: "Follow-up", icon: MessageSquare, href: "/crm/follow-up", resourceKey: "crm" },
    ],
  },
  {
    name: "Store",
    items: [
      { label: "Loja Online", icon: Store, href: "/store/loja", resourceKey: "store" },
      { label: "Catálogo", icon: Image, href: "/store/catalogo", resourceKey: "store" },
      { label: "Encomendas", icon: Truck, href: "/store/encomendas", resourceKey: "store" },
      { label: "Pagamentos", icon: DollarSign, href: "/store/pagamentos", resourceKey: "store" },
    ],
  },
  {
    name: "IA",
    items: [
      { label: "Assistente", icon: Bot, href: "/ia/assistente", resourceKey: "ia" },
      { label: "Análise de Vendas", icon: LineChart, href: "/ia/analise-vendas", resourceKey: "ia" },
      { label: "Previsões", icon: TrendingUp, href: "/ia/previsoes", resourceKey: "ia" },
      { label: "Recomendações", icon: Sparkles, href: "/ia/recomendacoes", resourceKey: "ia" },
      { label: "Relatórios", icon: PieChart, href: "/ia/relatorios", resourceKey: "ia" },
    ],
  },
  {
    name: "Marketing",
    items: [
      { label: "Campanhas", icon: Megaphone, href: "/marketing/campanhas", resourceKey: "marketing" },
      { label: "E-mail Marketing", icon: Mail, href: "/marketing/email-marketing", resourceKey: "marketing" },
      { label: "Promoções", icon: Gift, href: "/marketing/promocoes", resourceKey: "marketing" },
      { label: "Fidelização", icon: Users, href: "/marketing/fidelizacao", resourceKey: "marketing" },
    ],
  },
  {
    name: "RH",
    items: [
      { label: "Funcionários", icon: Users2, href: "/rh/funcionarios", resourceKey: "rh" },
      { label: "Salários", icon: Calculator, href: "/rh/salarios", resourceKey: "rh" },
      { label: "Férias", icon: Sun, href: "/rh/ferias", resourceKey: "rh" },
      { label: "Presenças", icon: Clock, href: "/rh/presencas", resourceKey: "rh" },
    ],
  },
  {
    name: "Educação",
    items: [
      { label: "Alunos", icon: GraduationCap, href: "/educacao/alunos", resourceKey: "students" },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const { user } = useAuth();
  const [allowedKeys, setAllowedKeys] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resources/user")
      .then((res) => res.json())
      .then((data) => {
        setAllowedKeys(data.allowedKeys ?? []);
      })
      .catch(() => {
        setAllowedKeys([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const visibleModules = isLoading
    ? modules
    : modules
        .map((mod) => ({
          ...mod,
          items: mod.items.filter(
            (item) => !item.resourceKey || (allowedKeys ?? []).includes(item.resourceKey)
          ),
        }))
        .filter((mod) => mod.items.length > 0);

  const sidebarContent = (
    <nav className="px-3 py-4 space-y-6 overflow-y-auto h-full">
      {visibleModules.map((mod) => (
        <div key={mod.name}>
          <div className="flex items-center gap-2 px-3 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ib-muted">
              {mod.name}
            </span>
            {mod.status === "coming-soon" && (
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
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px]",
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
      {user?.role === "admin" && (
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 px-3 mb-1">
            <Shield className="w-4 h-4 text-ib-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-ib-accent">Admin</span>
          </div>
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/admin"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px]",
                  pathname.startsWith("/admin")
                    ? "bg-ib-accent/20 text-ib-light font-medium"
                    : "text-ib-muted hover:text-white hover:bg-white/5"
                )}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                Admin da Plataforma
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-60 lg:w-64 xl:w-[280px] bg-ib-primary text-white flex-col">
        <div className="flex items-center justify-between px-4 lg:px-6 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ib-accent font-bold text-lg">
              IB
            </div>
            <span className="font-semibold text-lg tracking-tight">
              IBPlus<sup className="text-ib-accent font-bold">+</sup>
            </span>
          </div>
          <Link href="/" className="text-ib-muted hover:text-white transition-colors p-1" title="Voltar ao início">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          </Link>
        </div>
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden animate-fade-in"
          onClick={onClose}
        >
            <aside
              className="fixed left-0 top-0 z-50 h-screen w-[280px] bg-ib-primary text-white flex-col animate-slide-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ib-accent font-bold text-lg">
                    IB
                  </div>
                  <span className="font-semibold text-lg tracking-tight">
                    IBPlus<sup className="text-ib-accent font-bold">+</sup>
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Link href="/" className="text-ib-muted hover:text-white transition-colors p-1" title="Voltar ao início">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  </Link>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Fechar menu"
                  >
                    <X className="w-5 h-5 text-ib-muted" />
                  </button>
                </div>
              </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
