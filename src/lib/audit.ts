import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

/** Contexto que evita re-consultar a BD: o route handler já obtém o utilizador no topo. */
export type AuditActor = { companyId?: string | null; id?: string; userId?: string | null };

/**
 * Regista uma ação de auditoria.
 *
 * Aceita `actor` opcional (userId/companyId do handler) para **evitar um novo
 * `getAuthUser()` (query à BD) por mutação**. Sem actor, mantém o fallback
 * anterior (getAuthUser interno) para compatibilidade.
 */
export async function logAction(
  action: string,
  entity: string,
  entityId?: string,
  details?: string,
  actor?: AuditActor
) {
  try {
    let companyId: string | null | undefined;
    let userId: string | null | undefined;
    if (actor) {
      companyId = actor.companyId;
      userId = actor.userId ?? actor.id;
    } else {
      const user = await getAuthUser();
      companyId = user?.companyId;
      userId = user?.id;
    }
    if (!companyId) return;
    await prisma.auditLog.create({
      data: { companyId, userId: userId ?? null, action, entity, entityId, details },
    });
  } catch {
    // Non-critical
  }
}