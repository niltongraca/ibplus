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
  type LucideIcon,
} from "lucide-react";

export interface SidebarItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

export interface SidebarGroup {
  name: string;
  items: SidebarItem[];
}

const GESTAO = "Gestão";
const FINANCAS = "Finanças";
const CONFIG = "Configurações";

const dashboardItem: SidebarItem = { label: "Dashboard", icon: LayoutDashboard, href: "/gestao/dashboard" };
const perfilItem: SidebarItem = { label: "Perfil", icon: Settings, href: "/gestao/perfil" };

const SIDEBAR_CONFIG: Record<string, SidebarGroup[]> = {
  EMPREENDEDOR: [
    {
      name: GESTAO,
      items: [
        dashboardItem,
        { label: "Clientes", icon: Users, href: "/gestao/clientes" },
        { label: "Serviços", icon: FileText, href: "/gestao/servicos" },
        { label: "Vendas", icon: DollarSign, href: "/gestao/vendas" },
      ],
    },
    {
      name: FINANCAS,
      items: [
        { label: "Resumo Financeiro", icon: BarChart3, href: "/gestao/fluxo-caixa" },
      ],
    },
    { name: CONFIG, items: [perfilItem] },
  ],

  EMPRESA: [
    {
      name: GESTAO,
      items: [
        dashboardItem,
        { label: "Clientes", icon: Users, href: "/gestao/clientes" },
        { label: "Produtos", icon: Package, href: "/gestao/produtos" },
        { label: "Serviços", icon: FileText, href: "/gestao/servicos" },
        { label: "Stock", icon: Warehouse, href: "/gestao/stock" },
        { label: "Compras", icon: ShoppingCart, href: "/gestao/compras" },
        { label: "Vendas", icon: DollarSign, href: "/gestao/vendas" },
      ],
    },
    {
      name: FINANCAS,
      items: [
        { label: "Fluxo de Caixa", icon: BarChart3, href: "/gestao/fluxo-caixa" },
        { label: "Despesas", icon: TrendingDown, href: "/gestao/despesas" },
        { label: "Orçamentos", icon: Calculator, href: "/finance/orcamentos" },
        { label: "Faturação", icon: FileCheck, href: "/finance/faturacao" },
        { label: "Cobranças", icon: HandCoins, href: "/finance/cobrancas" },
      ],
    },
    {
      name: "CRM",
      items: [
        { label: "Funil de Vendas", icon: Target, href: "/crm/funil-vendas" },
      ],
    },
    {
      name: "IA",
      items: [
        { label: "Assistente", icon: Bot, href: "/ia/assistente" },
        { label: "Recomendações", icon: Sparkles, href: "/ia/recomendacoes" },
      ],
    },
    {
      name: "RH",
      items: [
        { label: "Funcionários", icon: Users2, href: "/rh/funcionarios" },
      ],
    },
    {
      name: "Marketing",
      items: [
        { label: "Campanhas", icon: Megaphone, href: "/marketing/campanhas" },
      ],
    },
    { name: CONFIG, items: [perfilItem] },
  ],

  ONG: [
    {
      name: GESTAO,
      items: [
        dashboardItem,
        { label: "Beneficiários", icon: Users, href: "/gestao/clientes" },
        { label: "Doações", icon: Gift, href: "/gestao/vendas" },
      ],
    },
    {
      name: "Marketing",
      items: [
        { label: "Campanhas", icon: Megaphone, href: "/marketing/campanhas" },
      ],
    },
    {
      name: FINANCAS,
      items: [
        { label: "Resumo Financeiro", icon: BarChart3, href: "/gestao/fluxo-caixa" },
      ],
    },
    { name: CONFIG, items: [perfilItem] },
  ],

  ASSOCIACAO: [
    {
      name: GESTAO,
      items: [
        dashboardItem,
        { label: "Associados", icon: Users, href: "/gestao/clientes" },
      ],
    },
    {
      name: FINANCAS,
      items: [
        { label: "Resumo Financeiro", icon: BarChart3, href: "/gestao/fluxo-caixa" },
      ],
    },
    { name: CONFIG, items: [perfilItem] },
  ],

  EDUCACAO: [
    {
      name: GESTAO,
      items: [
        dashboardItem,
        { label: "Alunos", icon: GraduationCap, href: "/educacao/alunos" },
      ],
    },
    {
      name: FINANCAS,
      items: [
        { label: "Resumo Financeiro", icon: BarChart3, href: "/gestao/fluxo-caixa" },
      ],
    },
    { name: CONFIG, items: [perfilItem] },
  ],

  COOPERATIVA: [
    {
      name: GESTAO,
      items: [
        dashboardItem,
        { label: "Cooperados", icon: Users, href: "/gestao/clientes" },
        { label: "Produtos", icon: Package, href: "/gestao/produtos" },
        { label: "Stock", icon: Warehouse, href: "/gestao/stock" },
      ],
    },
    {
      name: FINANCAS,
      items: [
        { label: "Resumo Financeiro", icon: BarChart3, href: "/gestao/fluxo-caixa" },
      ],
    },
    { name: CONFIG, items: [perfilItem] },
  ],
};

export function getSidebarConfig(accountType: string): SidebarGroup[] {
  return SIDEBAR_CONFIG[accountType] || SIDEBAR_CONFIG.EMPREENDEDOR;
}
