import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { parseBody } from "@/lib/validations/helpers";
import { upgradeReviewSchema } from "@/lib/validations/plans";
import { upgradeRejectedEmail, sendEmail } from "@/lib/email";
import { activateUpgrade } from "@/lib/upgradeActivation";

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

  let emailSent = false;

  if (status === "APPROVED") {
    const result = await activateUpgrade(upgrade, { id: admin.id, companyId: upgrade.companyId });
    emailSent = result.emailSent;
  } else {
    await prisma.upgradeRequest.update({
      where: { id },
      data: { status, reviewedAt: new Date(), reviewedBy: admin.id },
    });

    if (upgrade.companyId) {
      await createNotification(
        upgrade.companyId,
        "upgrade",
        "Pedido de upgrade rejeitado",
        `O pedido para ${upgrade.toPlan} não foi aprovado.`
      );
    }

    await logAction(
      "update",
      "upgrade_request",
      id,
      `Pedido rejeitado (${upgrade.fromPlan} → ${upgrade.toPlan})`,
      { id: admin.id, companyId: upgrade.companyId }
    );

    const mail = upgradeRejectedEmail(upgrade.user.name, upgrade.toPlan);
    emailSent = (await sendEmail(upgrade.user.email, mail.subject, mail.html)).success;
  }

  // O e-mail é informativo: a decisão já ficou registada mesmo que o SMTP falhe.
  return NextResponse.json({ success: true, emailSent });
}
