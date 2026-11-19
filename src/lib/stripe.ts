import Stripe from "stripe";
import { activePaymentProvider } from "@/config/payments";

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

/** Checkout disponível quando o gateway activo é o Stripe e há chave e preços configurados. */
export function isCheckoutEnabled(): boolean {
  return (
    activePaymentProvider(process.env.PAYMENT_PROVIDER) === "stripe" &&
    Boolean(getStripe() && stripePriceId("PREMIUM") && stripePriceId("BUSINESS"))
  );
}

/** Webhook só pode ser verificado quando o Stripe está activo e o segredo está configurado. */
export function isWebhookEnabled(): boolean {
  return (
    activePaymentProvider(process.env.PAYMENT_PROVIDER) === "stripe" &&
    Boolean(getStripe() && process.env.STRIPE_WEBHOOK_SECRET)
  );
}
