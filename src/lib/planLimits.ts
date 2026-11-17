import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import {
  canCreate,
  getPlanLimit,
  isUnlimited,
  planLimitMessage,
  type PlanLimitResource,
} from "@/config/planLimits";
import type { AuthUser } from "./permissions";

// As regras puras vivem em src/config/planLimits.ts (sem Prisma/Next) para
// poderem ser testadas. Reexportamos aqui para não quebrar os imports existentes.
export { getPlanLimit, isUnlimited, type PlanLimitResource } from "@/config/planLimits";

/**
 * O plano é guardado em `User`, mas os recursos limitados são da empresa.
 * O plano do dono é a fonte de verdade: membros convidados são criados com o
 * plano por omissão (FREE), pelo que usar `user.plan` bloquearia indevidamente
 * uma empresa Business. Se não houver dono identificável, usa-se o plano do
 * próprio utilizador.
 */
export async function getCompanyPlan(user: { companyId: string | null; plan: string }): Promise<string> {
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
    case "users": {
      // Convites pendentes reservam lugar: sem isto, era possível criar vários
      // convites com o limite livre e aceitá-los todos depois, excedendo o plano.
      const [users, pendingInvites] = await Promise.all([
        prisma.user.count({ where: { companyId } }),
        prisma.invite.count({ where: { companyId, used: false, expiresAt: { gt: new Date() } } }),
      ]);
      return users + pendingInvites;
    }
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
  if (canCreate(limit, used)) return null;

  return NextResponse.json(
    {
      error: planLimitMessage(plan, resource, limit),
      code: "PLAN_LIMIT_REACHED",
      resource,
      limit,
      used,
    },
    { status: 403 }
  );
}
