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
