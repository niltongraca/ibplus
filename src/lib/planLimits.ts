import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { PLANS, type PlanId } from "@/config/plans";
import type { AuthUser } from "./permissions";

/** Recursos sujeitos aos limites definidos em `src/config/plans.ts`. */
export type PlanLimitResource = "users" | "products" | "customers" | "invoices";

const LIMIT_KEYS: Record<PlanLimitResource, "maxUsers" | "maxProducts" | "maxCustomers" | "maxInvoices"> = {
  users: "maxUsers",
  products: "maxProducts",
  customers: "maxCustomers",
  invoices: "maxInvoices",
};

const RESOURCE_LABELS: Record<PlanLimitResource, string> = {
  users: "utilizadores",
  products: "produtos/serviços",
  customers: "clientes",
  invoices: "faturas",
};

/** Devolve o limite do plano para o recurso. `-1` significa ilimitado. */
export function getPlanLimit(plan: string, resource: PlanLimitResource): number {
  const planConfig = PLANS[(plan as PlanId)] ?? PLANS.FREE;
  const value = planConfig[LIMIT_KEYS[resource]];
  return typeof value === "number" ? value : 0;
}

export function isUnlimited(limit: number): boolean {
  return limit < 0;
}

/**
 * O plano é guardado em `User`, mas os recursos limitados são da empresa.
 * O plano do dono é a fonte de verdade: membros convidados são criados com o
 * plano por omissão (FREE), pelo que usar `user.plan` bloquearia indevidamente
 * uma empresa Business. Se não houver dono identificável, usa-se o plano do
 * próprio utilizador.
 */
export async function getCompanyPlan(user: AuthUser): Promise<string> {
  if (!user.companyId) return user.plan;

  const owner = await prisma.employee.findFirst({
    where: { companyId: user.companyId, isOwner: true, userId: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { user: { select: { plan: true } } },
  });

  return owner?.user?.plan ?? user.plan;
}

async function countResource(companyId: string, resource: PlanLimitResource): Promise<number> {
  switch (resource) {
    case "users":
      return prisma.user.count({ where: { companyId } });
    case "products": {
      // O limite é apresentado como "produtos/serviços", por isso conta ambos.
      const [products, services] = await Promise.all([
        prisma.product.count({ where: { companyId } }),
        prisma.service.count({ where: { companyId } }),
      ]);
      return products + services;
    }
    case "customers":
      return prisma.customer.count({ where: { companyId } });
    case "invoices":
      return prisma.invoice.count({ where: { companyId } });
    default:
      return 0;
  }
}

/**
 * Verifica se a empresa ainda pode criar mais um recurso do tipo indicado.
 * Retorna `null` quando autorizado, ou uma resposta 403 quando o limite do
 * plano foi atingido. Segue o mesmo contrato dos helpers de `permissions.ts`.
 */
export async function checkPlanLimit(
  user: AuthUser,
  resource: PlanLimitResource
): Promise<NextResponse | null> {
  if (user.role === "admin") return null;
  if (!user.companyId) return null;

  const plan = await getCompanyPlan(user);
  const limit = getPlanLimit(plan, resource);
  if (isUnlimited(limit)) return null;

  const used = await countResource(user.companyId, resource);
  if (used < limit) return null;

  const planName = PLANS[(plan as PlanId)]?.name ?? "actual";
  return NextResponse.json(
    {
      error: `O plano ${planName} permite até ${limit} ${RESOURCE_LABELS[resource]}. Faça upgrade para continuar.`,
      code: "PLAN_LIMIT_REACHED",
      resource,
      limit,
      used,
    },
    { status: 403 }
  );
}
