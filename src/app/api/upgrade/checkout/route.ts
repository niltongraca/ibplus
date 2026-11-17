import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { PlanType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getCompanyPlan } from "@/lib/planLimits";
import { isUpgrade } from "@/config/planLimits";
import { logAction } from "@/lib/audit";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { parseBody } from "@/lib/validations/helpers";
import { upgradeRequestSchema } from "@/lib/validations/plans";
import { getStripe, isCheckoutEnabled, stripePriceId } from "@/lib/stripe";

/** Permite à UI esconder o botão de pagamento quando o Stripe não está configurado. */
export async function GET() {
  return NextResponse.json({ enabled: isCheckoutEnabled() });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(`upgrade-checkout:${ip}`, "strict");
  if (!rate.allowed) return rateLimitResponse(rate.retryAfter!);

  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  if (!isCheckoutEnabled()) {
    return NextResponse.json(
      { error: "Pagamento online indisponível. Envie um pedido para aprovação.", code: "STRIPE_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  // O plano é da empresa: um membro convidado não pode pagar em nome dela.
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
    select: { id: true, toPlan: true },
  });
  if (existing) {
    return NextResponse.json(
      {
        error: existing.toPlan === toPlan
          ? "Já existe um pedido pendente para este plano."
          : "Já existe um pedido de upgrade pendente.",
        code: "UPGRADE_REQUEST_PENDING",
      },
      { status: 409 }
    );
  }

  const priceId = stripePriceId(toPlan);
  const stripe = getStripe();
  if (!stripe || !priceId) {
    return NextResponse.json({ error: "Plano de pagamento não configurado." }, { status: 503 });
  }

  // Id antecipado: permite associar a sessão ao pedido antes de o criar.
  const id = randomUUID();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const metadata = {
    upgradeRequestId: id,
    toPlan,
    userId: user.id,
    ...(user.companyId ? { companyId: user.companyId } : {}),
  };

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: id,
      customer_email: user.email,
      metadata,
      subscription_data: { metadata: { upgradeRequestId: id, toPlan } },
      success_url: `${appUrl}/upgrade?checkout=success&request=${id}`,
      cancel_url: `${appUrl}/upgrade?checkout=cancelled`,
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível iniciar o pagamento." }, { status: 502 });
  }

  await prisma.upgradeRequest.create({
    data: {
      id,
      userId: user.id,
      companyId: user.companyId,
      fromPlan: fromPlan as PlanType,
      toPlan,
      phone: phone || null,
      note: note || null,
      paymentStatus: "PENDING",
      stripeSessionId: session.id,
    },
  });

  await logAction("create", "upgrade_request", id, `${fromPlan} → ${toPlan} (checkout Stripe)`, user);
  return NextResponse.json({ url: session.url });
}
