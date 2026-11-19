import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, isWebhookEnabled } from "@/lib/stripe";
import { activateUpgrade } from "@/lib/upgradeActivation";

export const runtime = "nodejs";

/** O webhook activa o plano sem esperar pela aprovação administrativa. */
export async function POST(request: Request) {
  if (!isWebhookEnabled()) {
    return NextResponse.json({ error: "Webhook não configurado." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Assinatura em falta." }, { status: 400 });

  const payload = await request.text();
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe!.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const requestId = session.client_reference_id || session.metadata?.upgradeRequestId;
    if (requestId && session.payment_status === "paid") {
      await activatePaidUpgrade(requestId, session);
    }
  }

  return NextResponse.json({ received: true });
}

async function activatePaidUpgrade(requestId: string, session: Stripe.Checkout.Session) {
  const upgrade = await prisma.upgradeRequest.findUnique({
    where: { id: requestId },
    include: { user: { select: { name: true, email: true } } },
  });
  // Pedido desconhecido ou já tratado: responde 200 para o Stripe não reenviar.
  if (!upgrade || upgrade.status !== "PENDING" || upgrade.paymentStatus === "PAID") return;

  const subscription =
    typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription?.id ?? null);

  await activateUpgrade(
    upgrade,
    { id: "stripe", companyId: upgrade.companyId },
    { method: "stripe", stripeSubscriptionId: subscription, paidAt: new Date() }
  );
}
