import { PLANS, type PlanId } from "./plans";

/**
 * Regras puras dos limites por plano.Este módulo não importa Prisma nem Next,
 * para poder ser testado isoladamente (ao contrário de `src/lib/planLimits.ts`).
 */

/** Recursos sujeitos aos limites definidos em `src/config/plans.ts`. */
export type PlanLimitResource = "users" | "products" | "customers" | "invoices";

export const LIMIT_KEYS: Record<
  PlanLimitResource,
  "maxUsers" | "maxProducts" | "maxCustomers" | "maxInvoices"
> = {
  users: "maxUsers",
  products: "maxProducts",
  customers: "maxCustomers",
  invoices: "maxInvoices",
};

export const RESOURCE_LABELS: Record<PlanLimitResource, string> = {
  users: "utilizadores",
  products: "produtos/serviços",
  customers: "clientes",
  invoices: "faturas",
};

/** Devolve o limite do plano para o recurso. `-1` significa ilimitado. */
export function getPlanLimit(plan: string, resource: PlanLimitResource): number {
  const planConfig = PLANS[plan as PlanId] ?? PLANS.FREE;
  const value = planConfig[LIMIT_KEYS[resource]];
  return typeof value === "number" ? value : 0;
}

export function isUnlimited(limit: number): boolean {
  return limit < 0;
}

/** Verdadeiro quando ainda cabe mais um recurso. */
export function canCreate(limit: number, used: number): boolean {
  return isUnlimited(limit) || used < limit;
}

const PLAN_RANK: Record<PlanId, number> = { FREE: 0, PREMIUM: 1, BUSINESS: 2 };

/** Só aceita subida de plano (FREE → PREMIUM → BUSINESS). */
export function isUpgrade(from: string, to: string): boolean {
  const fromRank = PLAN_RANK[from as PlanId];
  const toRank = PLAN_RANK[to as PlanId];
  return fromRank !== undefined && toRank !== undefined && toRank > fromRank;
}

export function planLimitMessage(
  plan: string,
  resource: PlanLimitResource,
  limit: number
): string {
  const planName = PLANS[plan as PlanId]?.name ?? "actual";
  return `O plano ${planName} permite até ${limit} ${RESOURCE_LABELS[resource]}. Faça upgrade para continuar.`;
}
