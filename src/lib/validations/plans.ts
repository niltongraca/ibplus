import { z } from "zod";

export const UPGRADE_PLAN_IDS = ["PREMIUM", "BUSINESS"] as const;

export const upgradeRequestSchema = z.object({
  toPlan: z.enum(UPGRADE_PLAN_IDS, { message: "Plano inválido." }),
  phone: z.string().trim().max(50, "O telefone excede 50 caracteres.").optional().nullable(),
  note: z.string().trim().max(1000, "A nota excede 1000 caracteres.").optional().nullable(),
});
export type UpgradeRequestInput = z.infer<typeof upgradeRequestSchema>;

export const upgradeReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], { message: "Decisão inválida." }),
});
export type UpgradeReviewInput = z.infer<typeof upgradeReviewSchema>;

/**
 * Comprovativo de pagamento manual. Aceita a URL devolvida por /api/upload
 * (Vercel Blob ou data-URL de imagem) e/ou a referência da operação bancária.
 */
export const upgradeProofSchema = z.object({
  paymentRef: z
    .string()
    .trim()
    .max(60, "A referência excede 60 caracteres.")
    .optional()
    .nullable(),
  proofUrl: z
    .string()
    .trim()
    .max(8_000_000, "O comprovativo excede o tamanho máximo.")
    .refine((value) => value.startsWith("data:image/") || /^https:\/\//i.test(value), {
      message: "Comprovativo inválido.",
    })
    .optional()
    .nullable(),
});
export type UpgradeProofInput = z.infer<typeof upgradeProofSchema>;
