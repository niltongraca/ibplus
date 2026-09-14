import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Warehouse,
  ShoppingCart,
  DollarSign,
  TrendingDown,
  BarChart3,
  Settings,
  Gift,
  Megaphone,
  Users2,
  GraduationCap,
  Target,
  Bot,
  Sparkles,
  Calculator,
  FileCheck,
  HandCoins,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { FeatureKey } from "./permissions";

interface SidebarItem {
  label: string;
  icon: LucideIcon;
  href: string;
  feature?: FeatureKey;
  ownerOnly?: boolean;
}

interface SidebarGroup {
  name: string;
  items: SidebarItem[];
}

const GESTAO = "Gestão";
const FINANCAS = "Finanças";
const CONFIG = "Configurações";

const dashboardItem: SidebarItem = { label: "Dashboard", icon: LayoutDashboard, href: "/gestao/dashboard", feature: "dashboard" };
const perfilItem: SidebarItem = { label: "Perfil", icon: Settings, href: "/gestao/perfil" };
const relatorioItem: SidebarItem = { label: "Relatório", icon: BarChart3, href: "/gestao/relatorio", feature: "relatorios" };
const permissoesItem: SidebarItem = { label: "Permissões", icon: ShieldCheck, href: "/rh/permissoes", feature: "rh", ownerOnly: true };

const SIDEBAR_CONFIG: Record<string, SidebarGroup[]> = {
  EMPREENDEDOR: [
    {
      name: GESTAO,
      items: [
        dashboardItem,
        relatorioItem,
        { label: "Clientes", icon: Users, href: "/gestao/clientes", feature: "clientes" },
        { label: "Serviços", icon: FileText, href: "/gestao/servicos", feature: "servicos" },
        { label: "Vendas", icon: DollarSign, href: "/gestao/vendas", feature: "vendas" },
      ],
    },
    {
      name: FINANCAS,
      items: [
        { label: "Resumo Financeiro", icon: BarChart3, href: "/gestao/fluxo-caixa", feature: "fluxo-caixa" },
      ],
    },
    { name: CONFIG, items: [perfilItem] },
  ],

  EMPRESA: [
    {
      name: GESTAO,
      items: [
        dashboardItem,
        relatorioItem,
        { label: "Clientes", icon: Users, href: "/gestao/clientes", feature: "clientes" },
        { label: "Produtos", icon: Package, href: "/gestao/produtos", feature: "produtos" },
        { label: "Serviços", icon: FileText, href: "/gestao/servicos", feature: "servicos" },
        { label: "Stock", icon: Warehouse, href: "/gestao/stock", feature: "stock" },
        { label: "Compras", icon: ShoppingCart, href: "/gestao/compras", feature: "compras" },
        { label: "Vendas", icon: DollarSign, href: "/gestao/vendas", feature: "vendas" },
      ],
    },
    {
      name: FINANCAS,
      items: [
        { label: "Fluxo de Caixa", icon: BarChart3, href: "/gestao/fluxo-caixa", feature: "fluxo-caixa" },
        { label: "Despesas", icon: TrendingDown, href: "/gestao/despesas", feature: "despesas" },
        { label: "Orçamentos", icon: Calculator, href: "/finance/orcamentos", feature: "orcamentos" },
        { label: "Faturação", icon: FileCheck, href: "/finance/faturacao", feature: "faturacao" },
        { label: "Cobranças", icon: HandCoins, href: "/finance/cobrancas", feature: "cobrancas" },
      ],
    },
    {
      name: "CRM",
      items: [
        { label: "Funil de Vendas", icon: Target, href: "/crm/funil-vendas", feature: "crm" },
      ],
    },
    {
      name: "IA",
      items: [
        { label: "Assistente", icon: Bot, href: "/ia/assistente", feature: "ia" },
        { label: "Recomendações", icon: Sparkles, href: "/ia/recomendacoes", feature: "ia" },
      ],
    },
    {
      name: "RH",
      items: [
        { label: "Funcionários", icon: Users2, href: "/rh/funcionarios", feature: "rh" },
        permissoesItem,
      ],
    },
    {
      name: "Marketing",
      items: [
        { label: "Campanhas", icon: Megaphone, href: "/marketing/campanhas", feature: "marketing" },
      ],
    },
    { name: CONFIG, items: [perfilItem] },
  ],

  ONG: [
    {
      name: GESTAO,
      items: [
        dashboardItem,
        relatorioItem,
        { label: "Beneficiários", icon: Users, href: "/gestao/clientes", feature: "clientes" },
        { label: "Doações", icon: Gift, href: "/gestao/vendas", feature: "vendas" },
      ],
    },
    {
      name: "Marketing",
      items: [
        { label: "Campanhas", icon: Megaphone, href: "/marketing/campanhas", feature: "marketing" },
      ],
    },
    {
      name: FINANCAS,
      items: [
        { label: "Resumo Financeiro", icon: BarChart3, href: "/gestao/fluxo-caixa", feature: "fluxo-caixa" },
      ],
    },
    { name: CONFIG, items: [perfilItem] },
  ],

  ASSOCIACAO: [
    {
      name: GESTAO,
      items: [
        dashboardItem,
        relatorioItem,
        { label: "Associados", icon: Users, href: "/gestao/clientes", feature: "clientes" },
      ],
    },
    {
      name: FINANCAS,
      items: [
        { label: "Resumo Financeiro", icon: BarChart3, href: "/gestao/fluxo-caixa", feature: "fluxo-caixa" },
      ],
    },
    { name: CONFIG, items: [perfilItem] },
  ],

  EDUCACAO: [
    {
      name: GESTAO,
      items: [
        dashboardItem,
        relatorioItem,
        { label: "Alunos", icon: GraduationCap, href: "/educacao/alunos", feature: "educacao" },
      ],
    },
    {
      name: FINANCAS,
      items: [
        { label: "Resumo Financeiro", icon: BarChart3, href: "/gestao/fluxo-caixa", feature: "fluxo-caixa" },
      ],
    },
    { name: CONFIG, items: [perfilItem] },
  ],

  COOPERATIVA: [
    {
      name: GESTAO,
      items: [
        dashboardItem,
        relatorioItem,
        { label: "Cooperados", icon: Users, href: "/gestao/clientes", feature: "clientes" },
        { label: "Produtos", icon: Package, href: "/gestao/produtos", feature: "produtos" },
        { label: "Stock", icon: Warehouse, href: "/gestao/stock", feature: "stock" },
      ],
    },
    {
      name: FINANCAS,
      items: [
        { label: "Resumo Financeiro", icon: BarChart3, href: "/gestao/fluxo-caixa", feature: "fluxo-caixa" },
      ],
    },
    { name: CONFIG, items: [perfilItem] },
  ],
};

export function getSidebarConfig(accountType: string): SidebarGroup[] {
  return SIDEBAR_CONFIG[accountType] || SIDEBAR_CONFIG.EMPREENDEDOR;
}
