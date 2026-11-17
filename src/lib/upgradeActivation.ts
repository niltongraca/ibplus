import type { PlanType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAction, type AuditActor } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { sendEmail, upgradeApprovedEmail } from "@/lib/email";

/** Dados mínimos partilhados pela aprovação manual e pelo webhook do Stripe. */
export interface UpgradeForActivation {
  id: string;
  userId: string;
  companyId: string | null;
  fromPlan: PlanType;
  toPlan: PlanType;
  user: { name: string; email: string };
}

export interface ActivationResult {
  targetUserId: string;
  emailSent: boolean;
}

/**
 * Activa um plano aprovado (manualmente ou por pagamento).
 * Actualiza o dono da empresa, o pedido, notificação, auditoria e e-mail.
 * Idempotente do ponto de vista do chamador: o pedido já tem de estar PENDING.
 */
export async function activateUpgrade(
  upgrade: UpgradeForActivation,
  actor: AuditActor,
  payment?: { stripeSubscriptionId?: string | null; paidAt?: Date | null }
): Promise<ActivationResult> {
  // Só o dono detém o plano da empresa; em contas sem empresa, é o próprio.
  const owner = upgrade.companyId
    ? await prisma.employee.findFirst({
        where: { companyId: upgrade.companyId, isOwner: true, userId: { not: null } },
        orderBy: { createdAt: "asc" },
        select: { userId: true },
      })
    : null;
  const targetUserId = owner?.userId ?? upgrade.userId;

  await prisma.$transaction([
    prisma.user.update({ where: { id: targetUserId }, data: { plan: upgrade.toPlan } }),
    prisma.upgradeRequest.update({
      // O filtro de estado garante idempotência mesmo com webhooks duplicados.
      where: { id: upgrade.id, status: "PENDING" },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedBy: actor.id ?? "system",
        ...(payment
          ? {
              paymentStatus: "PAID" as const,
              stripeSubscriptionId: payment.stripeSubscriptionId ?? null,
              paidAt: payment.paidAt ?? new Date(),
            }
          : {}),
      },
    }),
  ]);

  if (upgrade.companyId) {
    await createNotification(
      upgrade.companyId,
      "upgrade",
      "Upgrade aprovado",
      `O plano da empresa passou para ${upgrade.toPlan}.`
    );
  }

  await logAction(
    "update",
    "upgrade_request",
    upgrade.id,
    `Pedido aprovado (${upgrade.fromPlan} → ${upgrade.toPlan})${payment ? " via Stripe" : ""}`,
    { ...actor, companyId: upgrade.companyId }
  );

  const mail = upgradeApprovedEmail(upgrade.user.name, upgrade.toPlan);
  const result = await sendEmail(upgrade.user.email, mail.subject, mail.html);
  return { targetUserId, emailSent: result.success };
}
