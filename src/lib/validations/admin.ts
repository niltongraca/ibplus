import { z } from "zod";

// ---- Contacto (público) ----
export const contactSchema = z.object({
  name: z.string().trim().min(1, "Todos os campos são obrigatórios.").max(100, "O nome excede 100 caracteres."),
  email: z.string().trim().email("Email inválido.").max(150),
  subject: z.string().trim().max(150).optional().nullable(),
  message: z.string().trim().min(1, "Todos os campos são obrigatórios.").max(5000, "A mensagem excede 5000 caracteres."),
});
export type ContactInput = z.infer<typeof contactSchema>;

// ---- Notificações ----
export const notificationCreateSchema = z.object({
  type: z.string().trim().max(50, "Tipo inválido.").optional().nullable(),
  title: z.string().trim().min(1, "O título é obrigatório.").max(300, "O título excede 300 caracteres."),
  message: z.string().trim().max(5000).optional().nullable(),
  link: z.string().trim().max(500).optional().nullable(),
  requiresUpdate: z.boolean().optional(),
});
export type NotificationCreateInput = z.infer<typeof notificationCreateSchema>;

export const notificationUpdateSchema = z.object({
  id: z.string().trim().max(100).optional().nullable(),
  readAll: z.boolean().optional(),
});
export type NotificationUpdateInput = z.infer<typeof notificationUpdateSchema>;

// ---- Envio de documentos por email ----
export const documentSendSchema = z.object({
  type: z.enum(["FATURA", "ORÇAMENTO"], { message: "Tipo de documento inválido." }),
  id: z.string().trim().min(1, "Documento não identificado.").max(100),
  to: z.string().trim().max(255).optional().nullable(),
});
export type DocumentSendInput = z.infer<typeof documentSendSchema>;

// ---- Relatórios ----
export const reportGenerateSchema = z.object({
  period: z.enum(["monthly", "quarterly", "annual"]).optional(),
});
export type ReportGenerateInput = z.infer<typeof reportGenerateSchema>;

// ---- Anúncios (admin) ----
export const announcementCreateSchema = z.object({
  title: z.string().trim().min(1, "O título é obrigatório.").max(300, "O título excede 300 caracteres."),
  message: z.string().trim().max(5000).optional().nullable(),
  link: z.string().trim().max(500).optional().nullable(),
  requiresUpdate: z.boolean().optional(),
});
export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>;

// ---- Recursos (admin) ----
export const resourceToggleSchema = z.object({
  id: z.string().min(1, "ID é obrigatório.").max(100),
  enabled: z.boolean(),
});
export type ResourceToggleInput = z.infer<typeof resourceToggleSchema>;

export const resourcePermissionToggleSchema = z.object({
  id: z.string().min(1, "ID é obrigatório.").max(100),
  allowed: z.boolean(),
});
export type ResourcePermissionToggleInput = z.infer<typeof resourcePermissionToggleSchema>;

// ---- Conteúdos (admin) ----
export const CONTENT_TYPES = ["VIDEO", "POST", "BOOK", "ARTICLE"] as const;
const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();

const contentType = z
  .string()
  .trim()
  .min(1, "Título, tipo e URL são obrigatórios.")
  .transform((v) => v.toUpperCase())
  .pipe(z.enum(CONTENT_TYPES, { message: "Título, tipo e URL são obrigatórios." }));

export const contentCreateSchema = z.object({
  title: z.string().trim().min(1, "Título, tipo e URL são obrigatórios.").max(300),
  type: contentType,
  url: z.string().trim().min(1, "Título, tipo e URL são obrigatórios.").max(2000),
  description: optionalText(5000),
  thumbnail: optionalText(2000),
  author: optionalText(200),
  tags: optionalText(500),
  featured: z.boolean().optional(),
});
export type ContentCreateInput = z.infer<typeof contentCreateSchema>;

export const contentUpdateSchema = z.object({
  title: z.string().trim().min(1, "O título não pode ficar vazio.").max(300).optional(),
  type: contentType.optional(),
  url: z.string().trim().min(1, "O URL não pode ficar vazio.").max(2000).optional(),
  description: optionalText(5000),
  thumbnail: optionalText(2000),
  author: optionalText(200),
  tags: optionalText(500),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
});
export type ContentUpdateInput = z.infer<typeof contentUpdateSchema>;

// ---- Empresas (admin) ----
export const adminCompanyUpdateSchema = z.object({
  id: z.string().trim().min(1, "ID é obrigatório.").max(100),
  name: z.string().trim().min(1).max(300).optional().nullable(),
  email: z
    .union([z.literal(""), z.string().trim().email("O email não é válido.").max(255)])
    .optional()
    .nullable(),
  nif: z.string().trim().max(50).optional().nullable(),
});
export type AdminCompanyUpdateInput = z.infer<typeof adminCompanyUpdateSchema>;

export const adminIdSchema = z.object({
  id: z.string().trim().min(1, "ID é obrigatório.").max(100),
});
export type AdminIdInput = z.infer<typeof adminIdSchema>;

// ---- Utilizadores (admin) ----
export const PLAN_TYPES = ["FREE", "PREMIUM", "BUSINESS"] as const;
export const ACCOUNT_TYPES = ["EMPREENDEDOR", "EMPRESA", "ONG", "ASSOCIACAO", "EDUCACAO", "COOPERATIVA"] as const;

export const adminUserUpdateSchema = z.object({
  id: z.string().trim().min(1, "ID é obrigatório.").max(100),
  role: z.string().trim().min(1).max(50).optional().nullable(),
  plan: z.enum(PLAN_TYPES).optional().nullable(),
  accountType: z.enum(ACCOUNT_TYPES).optional().nullable(),
});
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;