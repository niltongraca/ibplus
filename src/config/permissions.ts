export const CARGO_LEVELS = ["owner", "manager", "collaborator", "viewer"] as const;
export type CargoLevel = (typeof CARGO_LEVELS)[number];

export const CARGO_LEVEL_LABELS: Record<CargoLevel, string> = {
  owner: "Dono",
  manager: "Gestor",
  collaborator: "Colaborador",
  viewer: "Só-visualização",
};

export const LEVEL_ORDER: Record<CargoLevel, number> = {
  owner: 0,
  manager: 1,
  collaborator: 2,
  viewer: 3,
};

export const FEATURE_KEYS = [
  "dashboard",
  "clientes",
  "produtos",
  "servicos",
  "vendas",
  "compras",
  "despesas",
  "fluxo-caixa",
  "stock",
  "faturacao",
  "orcamentos",
  "cobrancas",
  "contas-pagar",
  "contas-receber",
  "relatorios",
  "rh",
  "marketing",
  "crm",
  "ia",
  "educacao",
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  dashboard: "Dashboard",
  clientes: "Clientes",
  produtos: "Produtos",
  servicos: "Serviços",
  vendas: "Vendas",
  compras: "Compras",
  despesas: "Despesas",
  "fluxo-caixa": "Fluxo de Caixa",
  stock: "Stock",
  faturacao: "Faturação",
  orcamentos: "Orçamentos",
  cobrancas: "Cobranças",
  "contas-pagar": "Contas a Pagar",
  "contas-receber": "Contas a Receber",
  relatorios: "Relatórios",
  rh: "Recursos Humanos",
  marketing: "Marketing",
  crm: "CRM",
  ia: "Inteligência Artificial",
  educacao: "Educação",
};

export const FEATURE_DESCRIPTIONS: Record<FeatureKey, string> = {
  dashboard: "Acesso ao painel principal e métricas gerais",
  clientes: "Gerir clientes, beneficiários e associados",
  produtos: "Gerir produtos e catálogo",
  servicos: "Gerir serviços oferecidos",
  vendas: "Gerir vendas e doações",
  compras: "Gerir compras e fornecedores",
  despesas: "Gerir despesas da organização",
  "fluxo-caixa": "Acesso ao resumo financeiro e fluxo de caixa",
  stock: "Gerir stock e movimentos de inventário",
  faturacao: "Gerir faturação",
  orcamentos: "Gerir orçamentos",
  cobrancas: "Gerir cobranças",
  "contas-pagar": "Gerir contas a pagar",
  "contas-receber": "Gerir contas a receber",
  relatorios: "Acesso a relatórios e análises",
  rh: "Secção de Recursos Humanos (funcionários, férias, presenças)",
  marketing: "Campanhas e marketing",
  crm: "Funil de vendas e oportunidades",
  ia: "Funcionalidades de inteligência artificial",
  educacao: "Gestão de alunos / instituição de ensino",
};

// Matriz default (tecto por nível). As empresas podem apenas remover acesso.
// A configuração dinâmica nunca expande além destes valores, garantindo
// consistência com o middleware (edge, sem acesso à BD).
export const DEFAULT_FEATURE_PERMISSIONS: Record<CargoLevel, Record<FeatureKey, boolean>> = {
  owner: Object.fromEntries(FEATURE_KEYS.map((f) => [f, true])) as Record<FeatureKey, boolean>,
  manager: Object.fromEntries(FEATURE_KEYS.map((f) => [f, true])) as Record<FeatureKey, boolean>,
  collaborator: {
    dashboard: true,
    clientes: true,
    produtos: true,
    servicos: true,
    vendas: true,
    compras: true,
    despesas: true,
    "fluxo-caixa": true,
    stock: true,
    relatorios: true,
    faturacao: false,
    orcamentos: false,
    cobrancas: false,
    "contas-pagar": false,
    "contas-receber": false,
    rh: false,
    marketing: false,
    crm: false,
    ia: false,
    educacao: false,
  },
  viewer: {
    dashboard: true,
    clientes: true,
    relatorios: true,
    produtos: false,
    servicos: false,
    vendas: false,
    compras: false,
    despesas: false,
    "fluxo-caixa": false,
    stock: false,
    faturacao: false,
    orcamentos: false,
    cobrancas: false,
    "contas-pagar": false,
    "contas-receber": false,
    rh: false,
    marketing: false,
    crm: false,
    ia: false,
    educacao: false,
  },
};

// Operações permitidas por nível (regras fixas, independentes das features)
export const WRITE_LEVELS: readonly CargoLevel[] = ["owner", "manager", "collaborator"];
export const DELETE_LEVELS: readonly CargoLevel[] = ["owner", "manager"];
export const TEAM_MANAGE_LEVELS: readonly CargoLevel[] = ["owner", "manager"];
export const CARGOS_MANAGE_LEVELS: readonly CargoLevel[] = ["owner"];

// Mapa rota -> feature para o middleware (edge) e sidebar
export const ROUTE_FEATURE_MAP: Record<string, FeatureKey> = {
  "/gestao/dashboard": "dashboard",
  "/gestao/clientes": "clientes",
  "/gestao/produtos": "produtos",
  "/gestao/servicos": "servicos",
  "/gestao/vendas": "vendas",
  "/gestao/compras": "compras",
  "/gestao/despesas": "despesas",
  "/gestao/stock": "stock",
  "/gestao/fluxo-caixa": "fluxo-caixa",
  "/gestao/relatorio": "relatorios",
  "/finance/orcamentos": "orcamentos",
  "/finance/faturacao": "faturacao",
  "/finance/cobrancas": "cobrancas",
  "/finance/contas-pagar": "contas-pagar",
  "/finance/contas-receber": "contas-receber",
  "/finance/relatorios": "relatorios",
  "/crm": "crm",
  "/ia": "ia",
  "/rh": "rh",
  "/marketing": "marketing",
  "/educacao": "educacao",
};