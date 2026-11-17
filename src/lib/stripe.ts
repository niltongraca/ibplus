import Stripe from "stripe";

/** Cliente Stripe preguiçoso: a app continua a funcionar sem credenciais (modo aprovação manual). */
let cached: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (cached !== undefined) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  cached = key ? new Stripe(key) : null;
  return cached;
}

export type PaidPlanId = "PREMIUM" | "BUSINESS";

export function stripePriceId(plan: PaidPlanId): string | null {
  const env = plan === "PREMIUM" ? "STRIPE_PRICE_PREMIUM" : "STRIPE_PRICE_BUSINESS";
  return process.env[env] || null;
}

/** Checkout disponível quando há chave e preços configurados para os dois planos pagos. */
export function isCheckoutEnabled(): boolean {
  return Boolean(getStripe() && stripePriceId("PREMIUM") && stripePriceId("BUSINESS"));
}

/** Webhook só pode ser verificado quando o segredo está configurado. */
export function isWebhookEnabled(): boolean {
  return Boolean(getStripe() && process.env.STRIPE_WEBHOOK_SECRET);
}
