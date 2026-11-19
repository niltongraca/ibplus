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

export type UpgradePaymentMethod = "stripe" | "manual";

export interface UpgradePaymentInfo {
  method: UpgradePaymentMethod;
  stripeSubscriptionId?: string | null;
  paidAt?: Date | null;
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
  payment: UpgradePaymentInfo = { method: "manual" }
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
        paymentStatus: "PAID",
        paymentMethod: payment.method,
        stripeSubscriptionId: payment.stripeSubscriptionId ?? null,
        paidAt: payment.paidAt ?? new Date(),
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

  const via = payment.method === "stripe" ? " via Stripe" : " por pagamento manual";
  await logAction(
    "update",
    "upgrade_request",
    upgrade.id,
    `Pedido aprovado (${upgrade.fromPlan} → ${upgrade.toPlan})${via}`,
    { ...actor, companyId: upgrade.companyId }
  );

  const mail = upgradeApprovedEmail(upgrade.user.name, upgrade.toPlan);
  const result = await sendEmail(upgrade.user.email, mail.subject, mail.html);
  return { targetUserId, emailSent: result.success };
}
