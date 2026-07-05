export type PlanId = "FREE" | "PREMIUM" | "BUSINESS";

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  highlighted: boolean;
  features: PlanFeature[];
  maxUsers?: number;
  maxProducts?: number;
  maxCustomers?: number;
  maxInvoices?: number;
}

export const PLANS: Record<PlanId, Plan> = {
  FREE: {
    id: "FREE",
    name: "Grátis",
    price: 0,
    priceLabel: "Grátis",
    description: "Para começar",
    highlighted: false,
    features: [
      { text: "Dashboard básico", included: true },
      { text: "Gestão de perfil", included: true },
      { text: "Até 10 produtos/serviços", included: true },
      { text: "Até 50 clientes", included: true },
      { text: "Facturação básica", included: true },
      { text: "Relatórios mensais", included: false },
      { text: "Módulo financeiro", included: false },
      { text: "Módulo RH", included: false },
      { text: "Marketing", included: false },
      { text: "Suporte prioritário", included: false },
    ],
    maxUsers: 1,
    maxProducts: 10,
    maxCustomers: 50,
    maxInvoices: 20,
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium",
    price: 5000,
    priceLabel: "5.000 Kz/mês",
    description: "Para negócios em crescimento",
    highlighted: true,
    features: [
      { text: "Dashboard completo", included: true },
      { text: "Gestão de perfil", included: true },
      { text: "Produtos/serviços ilimitados", included: true },
      { text: "Clientes ilimitados", included: true },
      { text: "Facturação avançada", included: true },
      { text: "Relatórios mensais", included: true },
      { text: "Módulo financeiro", included: true },
      { text: "Módulo RH", included: false },
      { text: "Marketing básico", included: true },
      { text: "Suporte por email", included: true },
    ],
    maxUsers: 5,
    maxProducts: -1,
    maxCustomers: -1,
    maxInvoices: -1,
  },
  BUSINESS: {
    id: "BUSINESS",
    name: "Business",
    price: 15000,
    priceLabel: "15.000 Kz/mês",
    description: "Para empresas estabelecidas",
    highlighted: false,
    features: [
      { text: "Dashboard completo", included: true },
      { text: "Gestão de perfil", included: true },
      { text: "Produtos/serviços ilimitados", included: true },
      { text: "Clientes ilimitados", included: true },
      { text: "Facturação avançada", included: true },
      { text: "Relatórios mensais", included: true },
      { text: "Módulo financeiro", included: true },
      { text: "Módulo RH", included: true },
      { text: "Marketing completo", included: true },
      { text: "Suporte prioritário 24/7", included: true },
    ],
    maxUsers: -1,
    maxProducts: -1,
    maxCustomers: -1,
    maxInvoices: -1,
  },
};

export const PLAN_LIST: Plan[] = [PLANS.FREE, PLANS.PREMIUM, PLANS.BUSINESS];
