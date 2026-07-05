export const DASHBOARD_WIDGETS = {
  stats: { id: "stats", title: "Visão Geral", description: "Métricas principais do negócio" },
  clients: { id: "clients", title: "Clientes", description: "Gestão de clientes" },
  finance: { id: "finance", title: "Finanças", description: "Resumo financeiro" },
  products: { id: "products", title: "Produtos", description: "Produtos e inventário" },
  services: { id: "services", title: "Serviços", description: "Serviços prestados" },
  hr: { id: "hr", title: "Recursos Humanos", description: "Equipa e colaboradores" },
  sales: { id: "sales", title: "Vendas", description: "Vendas recentes" },
  donations: { id: "donations", title: "Doações", description: "Doações recebidas" },
  students: { id: "students", title: "Alunos", description: "Gestão de alunos" },
  campaigns: { id: "campaigns", title: "Campanhas", description: "Campanhas de marketing" },
  inventory: { id: "inventory", title: "Stock", description: "Controlo de inventário" },
} as const;

export type WidgetId = keyof typeof DASHBOARD_WIDGETS;
