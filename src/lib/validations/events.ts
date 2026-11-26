import { z } from "zod";
import {
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  TICKET_KINDS,
  TICKET_STATUSES,
} from "@/config/events";

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();

// Aceita "", null ou email válido (os formulários enviam string vazia quando não preenchido).
const optionalEmail = z
  .union([
    z.literal(""),
    z.string().trim().email("O email não é válido.").max(255, "O email excede 255 caracteres."),
  ])
  .optional()
  .nullable();

const money = z.coerce
  .number()
  .finite("O valor deve ser um número.")
  .min(0, "O valor não pode ser negativo.")
  .max(1e15, "O valor é demasiado elevado.");

const quantity = z.coerce
  .number()
  .int("A quantidade deve ser um número inteiro.")
  .min(0, "A quantidade não pode ser negativa.")
  .max(1e9, "A quantidade é demasiado elevada.");

// ---- Evento ----
export const eventCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "O título é obrigatório.")
    .max(200, "O título excede 200 caracteres."),
  description: optionalText(5000),
  category: z.enum(EVENT_CATEGORIES).optional().nullable(),
  venue: optionalText(300),
  address: optionalText(500),
  province: optionalText(100),
  municipality: optionalText(100),
  startDate: z.string().trim().min(1, "A data de início é obrigatória."),
  endDate: optionalText(50),
  coverImage: optionalText(2000),
  localPurchaseValue: money.optional(),
  totalTickets: quantity.optional(),
  status: z.enum(EVENT_STATUSES).optional(),
  published: z.boolean().optional(),
  notes: optionalText(5000),
});
export type EventCreateInput = z.infer<typeof eventCreateSchema>;

export const eventUpdateSchema = eventCreateSchema.partial();
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;

// ---- Tipo de bilhete ----
export const ticketTypeCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "O nome é obrigatório.")
    .max(120, "O nome excede 120 caracteres."),
  kind: z.enum(TICKET_KINDS).optional(),
  description: optionalText(2000),
  price: money.optional(),
  quantity: quantity.optional(),
  active: z.boolean().optional(),
});
export type TicketTypeCreateInput = z.infer<typeof ticketTypeCreateSchema>;

export const ticketTypeUpdateSchema = ticketTypeCreateSchema.partial();
export type TicketTypeUpdateInput = z.infer<typeof ticketTypeUpdateSchema>;

/**
 * Criação do evento e dos seus tipos numa só operação atómica: se um tipo for
 * inválido, nenhum evento fica órfão no painel.
 */
export const eventCreateWithTypesSchema = eventCreateSchema.extend({
  ticketTypes: z.array(ticketTypeCreateSchema).max(50).optional(),
});
export type EventCreateWithTypesInput = z.infer<typeof eventCreateWithTypesSchema>;

// ---- Emissão de bilhetes ----
export const ticketIssueSchema = z.object({
  ticketTypeId: z
    .string()
    .trim()
    .min(1, "Seleccione um tipo de bilhete.")
    .max(100),
  quantity: z.coerce
    .number()
    .int("A quantidade deve ser um número inteiro.")
    .min(1, "Emita pelo menos 1 bilhete.")
    .max(500, "Máximo de 500 bilhetes por operação.")
    .optional(),
  holderName: optionalText(200),
  holderEmail: optionalEmail,
  holderPhone: optionalText(50),
  notes: optionalText(2000),
});
export type TicketIssueInput = z.infer<typeof ticketIssueSchema>;

export const ticketUpdateSchema = z.object({
  holderName: optionalText(200),
  holderEmail: optionalEmail,
  holderPhone: optionalText(50),
  status: z.enum(TICKET_STATUSES).optional(),
  checkedIn: z.boolean().optional(),
  notes: optionalText(2000),
});
export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;

// ---- Check-in por código ----
export const checkinSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Introduza o código do bilhete.")
    .max(100, "O código é demasiado longo."),
});
export type CheckinInput = z.infer<typeof checkinSchema>;

// ---- Inscrição pública (link do evento) ----
// Referência de pagamento gerada no browser antes de o participante pagar,
// para que possa indicá-la na transferência e anexar o comprovativo no POST.
// Deve coincidir com o formato de generateRegistrationCode().
export const registrationReferenceSchema = z
  .string()
  .trim()
  .regex(/^INS-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/, "Referência de pagamento inválida.");

export const publicRegistrationSchema = z.object({
  reference: registrationReferenceSchema.optional(),
  holderName: z
    .string()
    .trim()
    .min(2, "Indique o seu nome completo.")
    .max(200, "O nome excede 200 caracteres."),
  holderEmail: z
    .string()
    .trim()
    .email("O email não é válido.")
    .max(255, "O email excede 255 caracteres."),
  holderPhone: z
    .string()
    .trim()
    .min(6, "Indique um telefone válido.")
    .max(50, "O telefone é demasiado longo.")
    .regex(/^[0-9+()\s-]+$/, "O telefone contém caracteres inválidos."),
  consent: z.boolean().refine((v) => v === true, {
    message: "É necessário autorizar o tratamento dos dados.",
  }),
  items: z
    .array(
      z.object({
        ticketTypeId: z.string().trim().min(1).max(100),
        quantity: z.coerce
          .number()
          .int("A quantidade deve ser um número inteiro.")
          .min(1, "Indique pelo menos 1 bilhete.")
          .max(50, "Máximo de 50 bilhetes por tipo."),
      })
    )
    .min(1, "Selecione pelo menos um tipo de bilhete.")
    .max(10, "Máximo de 10 tipos de bilhete por inscrição.")
    .refine(
      (items) => new Set(items.map((i) => i.ticketTypeId)).size === items.length,
      { message: "Não repita tipos de bilhete." }
    ),
  notes: optionalText(2000),
});
export type PublicRegistrationInput = z.infer<typeof publicRegistrationSchema>;

export const registrationDecisionSchema = z
  .object({
    action: z.enum(["APROVAR", "REJEITAR", "CANCELAR"]),
    reason: optionalText(500),
  })
  .refine((v) => v.action !== "REJEITAR" || Boolean(v.reason?.trim()), {
    message: "Indique o motivo da rejeição.",
    path: ["reason"],
  });
export type RegistrationDecisionInput = z.infer<typeof registrationDecisionSchema>;
