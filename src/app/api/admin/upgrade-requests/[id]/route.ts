import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { parseBody } from "@/lib/validations/helpers";
import { upgradeReviewSchema } from "@/lib/validations/plans";
import { upgradeApprovedEmail, upgradeRejectedEmail, sendEmail } from "@/lib/email";

interface Context {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Context) {
  const admin = await getAuthUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const parsed = await parseBody(request, upgradeReviewSchema);
  if ("error" in parsed) return parsed.error;
  const { status } = parsed.data;

  const { id } = await params;
  const upgrade = await prisma.upgradeRequest.findUnique({
    where: { id },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!upgrade) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  if (upgrade.status !== "PENDING") {
    return NextResponse.json({ error: "Este pedido já foi analisado." }, { status: 409 });
  }

  if (status === "APPROVED") {
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
        where: { id },
        data: { status, reviewedAt: new Date(), reviewedBy: admin.id },
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
  } else {
    await prisma.upgradeRequest.update({
      where: { id },
      data: { status, reviewedAt: new Date(), reviewedBy: admin.id },
    });
  }

  await logAction(
    "update",
    "upgrade_request",
    id,
    `Pedido ${status === "APPROVED" ? "aprovado" : "rejeitado"} (${upgrade.fromPlan} → ${upgrade.toPlan})`,
    { id: admin.id, companyId: upgrade.companyId }
  );

  // O e-mail é informativo: a decisão já ficou registada mesmo que o SMTP falhe.
  const mail =
    status === "APPROVED"
      ? upgradeApprovedEmail(upgrade.user.name, upgrade.toPlan)
      : upgradeRejectedEmail(upgrade.user.name, upgrade.toPlan);
  const emailResult = await sendEmail(upgrade.user.email, mail.subject, mail.html);

  return NextResponse.json({ success: true, emailSent: emailResult.success });
}
