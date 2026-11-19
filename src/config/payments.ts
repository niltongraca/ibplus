import { PLANS, type PlanId } from "@/config/plans";

/**
 * Gateway de pagamento activo.
 * "none" mantém o checkout do Stripe inactivo mesmo que existam chaves
 * configuradas — o upgrade segue por cobrança manual (transferência /
 * Multicaixa) com comprovativo e aprovação administrativa.
 */
export type PaymentProvider = "none" | "stripe";

export function activePaymentProvider(raw?: string | null): PaymentProvider {
  return (raw ?? "").trim().toLowerCase() === "stripe" ? "stripe" : "none";
}

export interface ManualPaymentDetails {
  bankName: string;
  accountName: string;
  iban: string;
  multicaixaEntity: string;
  supportPhone: string;
}

/**
 * Dados públicos de cobrança manual mostrados em /upgrade.
 * Acesso literal a process.env.NEXT_PUBLIC_* para o Next os injectar no bundle.
 */
export function getManualPaymentDetails(): ManualPaymentDetails {
  return {
    bankName: process.env.NEXT_PUBLIC_PAYMENT_BANK?.trim() || "",
    accountName: process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME?.trim() || "",
    iban: process.env.NEXT_PUBLIC_PAYMENT_IBAN?.trim() || "",
    multicaixaEntity: process.env.NEXT_PUBLIC_PAYMENT_MULTICAIXA_ENTITY?.trim() || "",
    supportPhone: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim() || "",
  };
}

/** Há pelo menos uma forma de pagamento configurada? */
export function hasManualPaymentDetails(details: ManualPaymentDetails): boolean {
  return Boolean(details.iban || details.multicaixaEntity);
}

/**
 * Referência legível e estável derivada do id do pedido.
 * Ex.: "clx9f0..." → "IBP-CLX9F0".
 */
export function paymentReference(requestId: string): string {
  const clean = requestId.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return `IBP-${clean.slice(0, 8) || "00000000"}`;
}

/** Valor mensal a cobrar pelo plano (0 nos planos gratuitos). */
export function planAmount(planId: PlanId): number {
  return PLANS[planId]?.price ?? 0;
}
