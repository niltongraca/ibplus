import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { PlanType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getCompanyPlan } from "@/lib/planLimits";
import { isUpgrade } from "@/config/planLimits";
import { paymentReference, planAmount } from "@/config/payments";
import { logAction } from "@/lib/audit";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { parseBody } from "@/lib/validations/helpers";
import { upgradeRequestSchema } from "@/lib/validations/plans";

/**
 * Pedido de upgrade por cobrança manual.
 * Devolve o pedido pendente do utilizador/empresa (se existir) para a UI
 * poder retomar as instruções de pagamento depois de recarregar a página.
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const pending = await prisma.upgradeRequest.findFirst({
    where: {
      status: "PENDING",
      ...(user.companyId ? { companyId: user.companyId } : { companyId: null, userId: user.id }),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      toPlan: true,
      paymentStatus: true,
      paymentRef: true,
      paymentProofUrl: true,
      createdAt: true,
    },
  });

  if (!pending) return NextResponse.json({ request: null });

  const { paymentProofUrl, ...rest } = pending;
  return NextResponse.json({ request: { ...rest, hasProof: Boolean(paymentProofUrl) } });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(`upgrade:${ip}`, "strict");
  if (!rate.allowed) return rateLimitResponse(rate.retryAfter!);

  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  // O plano é da empresa: um membro convidado não pode pedir upgrade em nome dela.
  if (user.companyId && !user.isOwner) {
    return NextResponse.json(
      { error: "Apenas o responsável da empresa pode pedir upgrade." },
      { status: 403 }
    );
  }

  const parsed = await parseBody(request, upgradeRequestSchema);
  if ("error" in parsed) return parsed.error;
  const { toPlan, phone, note } = parsed.data;

  const fromPlan = await getCompanyPlan(user);
  if (!isUpgrade(fromPlan, toPlan)) {
    return NextResponse.json(
      { error: "O plano escolhido não é um upgrade do plano actual." },
      { status: 400 }
    );
  }

  const existing = await prisma.upgradeRequest.findFirst({
    where: {
      status: "PENDING",
      ...(user.companyId ? { companyId: user.companyId } : { companyId: null, userId: user.id }),
    },
    select: { id: true, toPlan: true, paymentRef: true },
  });
  if (existing) {
    return NextResponse.json(
      {
        error: existing.toPlan === toPlan
          ? "Já existe um pedido pendente para este plano."
          : "Já existe um pedido de upgrade pendente.",
        code: "UPGRADE_REQUEST_PENDING",
        requestId: existing.id,
        paymentRef: existing.paymentRef,
      },
      { status: 409 }
    );
  }

  // Id antecipado: a referência de pagamento deriva dele e fica estável.
  const id = randomUUID();
  const created = await prisma.upgradeRequest.create({
    data: {
      id,
      userId: user.id,
      companyId: user.companyId,
      fromPlan: fromPlan as PlanType,
      toPlan,
      phone: phone || null,
      note: note || null,
      paymentMethod: "manual",
      paymentRef: paymentReference(id),
      amount: planAmount(toPlan),
    },
  });

  await logAction("create", "upgrade_request", created.id, `${fromPlan} → ${toPlan} (manual)`, user);
  return NextResponse.json({ request: created }, { status: 201 });
}
