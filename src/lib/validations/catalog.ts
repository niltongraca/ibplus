import { z } from "zod";
import { productSchema } from "./products";

// ---- Categorias ----
export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório.").max(100, "O nome excede 100 caracteres."),
});
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export const categoryUpdateSchema = categoryCreateSchema;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

// ---- Produtos ----
// POST usa o schema original (name/price obrigatórios); PUT apenas campos parciais.
export const productUpdateSchema = productSchema.partial();
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
// Ajuste de stock (endpoint especial do PUT /api/products/[id])
export const productStockAdjustSchema = z.object({
  stockAdjust: z.coerce
    .number()
    .int("O ajuste de stock deve ser um número inteiro diferente de zero.")
    .max(1e9)
    .refine((v) => v !== 0, { message: "O ajuste de stock deve ser um número inteiro diferente de zero." }),
  notes: z.string().trim().max(2000).optional().nullable(),
});
export type ProductStockAdjustInput = z.infer<typeof productStockAdjustSchema>;

// ---- Serviços ----
export const serviceCreateSchema = z.object({
  name: z.string().trim().min(1, "O nome é obrigatório.").max(200, "O nome excede 200 caracteres."),
  description: z.string().trim().max(5000).optional().nullable(),
  price: z.coerce.number().finite("O preço deve ser um número positivo.").positive("O preço deve ser um número positivo.").max(1e15),
  duration: z.string().trim().max(500).optional().nullable(),
});
export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;
export const serviceUpdateSchema = z.object({
  name: z.string().trim().min(1, "O nome não pode ficar vazio.").max(200, "O nome excede 200 caracteres.").optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  price: z.coerce.number().finite("O preço deve ser um número positivo.").positive("O preço deve ser um número positivo.").max(1e15).optional(),
  duration: z.string().trim().max(500).optional().nullable(),
  active: z.boolean().optional(),
});
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;

// ---- Clientes ----
const customerEmail = z
  .union([z.literal(""), z.string().trim().email("O email não é válido.").max(255)])
  .optional()
  .nullable();

export const customerCreateSchema = z.object({
  name: z.string().trim().min(1, "O nome é obrigatório.").max(300, "O nome excede 300 caracteres."),
  email: customerEmail,
  phone: z.string().trim().max(50).optional().nullable(),
  nif: z.string().trim().max(50).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  type: z.enum(["empresa", "particular"]).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
});
export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export const customerUpdateSchema = z.object({
  name: z.string().trim().min(1, "O nome não pode ficar vazio.").max(300, "O nome excede 300 caracteres.").optional(),
  email: customerEmail,
  phone: z.string().trim().max(50).optional().nullable(),
  nif: z.string().trim().max(50).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  type: z.enum(["empresa", "particular"]).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  stage: z.string().trim().max(100).optional().nullable(),
});
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;

// ---- Oportunidades (CRM) ----
export const OPPORTUNITY_STAGES = ["lead", "qualified", "proposal", "negotiation", "closed"] as const;

export const opportunityCreateSchema = z.object({
  title: z.string().trim().min(1, "O título é obrigatório.").max(300, "O título excede 300 caracteres."),
  customerId: z.string().min(1, "O cliente é obrigatório.").max(100),
  value: z.coerce.number().finite().min(0, "O valor não pode ser negativo.").max(1e15).optional(),
  stage: z.enum(OPPORTUNITY_STAGES).optional(),
  notes: z.string().trim().max(5000).optional().nullable(),
});
export type OpportunityCreateInput = z.infer<typeof opportunityCreateSchema>;

export const opportunityPatchSchema = z.object({
  id: z.string().min(1, "ID em falta.").max(100),
  stage: z.enum(OPPORTUNITY_STAGES).optional(),
  value: z.coerce.number().finite().min(0, "O valor não pode ser negativo.").max(1e15).optional(),
  notes: z.string().trim().max(5000).optional().nullable(),
});
export type OpportunityPatchInput = z.infer<typeof opportunityPatchSchema>;

export const opportunityDeleteSchema = z.object({
  id: z.string().min(1, "ID em falta.").max(100),
});
export type OpportunityDeleteInput = z.infer<typeof opportunityDeleteSchema>;

// ---- Campanhas (Marketing) ----
export const CAMPAIGN_TYPES = ["email", "social", "sms", "whatsapp", "other"] as const;
export const CAMPAIGN_STATUSES = ["draft", "active", "paused", "completed", "cancelled"] as const;

export const campaignCreateSchema = z.object({
  name: z.string().trim().min(1, "O nome é obrigatório.").max(300, "O nome excede 300 caracteres."),
  type: z.enum(CAMPAIGN_TYPES).optional(),
  status: z.enum(CAMPAIGN_STATUSES).optional(),
  budget: z.coerce.number().finite().min(0, "O orçamento não pode ser negativo.").max(1e15).optional().nullable(),
  startDate: z.string().trim().max(50).optional().nullable(),
  endDate: z.string().trim().max(50).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
});
export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;
export const campaignUpdateSchema = campaignCreateSchema.partial();
export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>;

// ---- Checkout (loja) ----
export const CHECKOUT_PAYMENT_METHODS = ["cash", "card", "transfer", "multicaixa"] as const;

export const checkoutSchema = z.object({
  customerName: z.string().trim().max(300, "O nome do cliente excede 300 caracteres.").optional().nullable(),
  paymentMethod: z.enum(CHECKOUT_PAYMENT_METHODS).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Produto inválido no carrinho.").max(100),
        quantity: z.coerce.number().int("Quantidade inválida.").positive("Quantidade inválida.").max(1e9),
      })
    )
    .min(1, "Carrinho vazio.")
    .max(500),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;