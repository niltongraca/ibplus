import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function logAction(
  action: string,
  entity: string,
  entityId?: string,
  details?: string
) {
  try {
    const user = await getAuthUser();
    if (!user?.companyId) return;
    await prisma.auditLog.create({
      data: { companyId: user.companyId, userId: user.id, action, entity, entityId, details },
    });
  } catch {
    // Non-critical
  }
}
