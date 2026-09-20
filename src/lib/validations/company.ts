import { z } from "zod";

export const CARGO_LEVELS = ["owner", "manager", "collaborator", "viewer"] as const;
export const SUB_TYPES = ["SUBEMPRESA", "ORGANIZACAO", "FILIAL", "SUCURSAL"] as const;

// ---- Empresa (perfil) ----
export const companyUpdateSchema = z.object({
  name: z.string().trim().min(1, "O nome da empresa não pode ficar vazio.").max(300, "O nome excede 300 caracteres.").optional(),
  nif: z.string().trim().max(50, "O NIF excede 50 caracteres.").nullable().optional(),
  phone: z.string().trim().max(50, "O telefone excede 50 caracteres.").nullable().optional(),
  address: z.string().trim().max(500, "A morada excede 500 caracteres.").nullable().optional(),
  email: z
    .union([z.literal(""), z.string().trim().email("O email não é válido.").max(255)])
    .nullable()
    .optional(),
  logo: z.string().trim().max(10000, "O logo excede o limite.").nullable().optional(),
  whatsappNumber: z.string().trim().max(50, "O WhatsApp excede 50 caracteres.").nullable().optional(),
  whatsappStore: z.string().trim().max(50, "O WhatsApp da loja excede 50 caracteres.").nullable().optional(),
  provinciaOperacao: z.string().trim().max(100, "A província excede 100 caracteres.").nullable().optional(),
  horarioFuncionamento: z.string().trim().max(500, "O horário excede 500 caracteres.").nullable().optional(),
  descricaoLoja: z.string().trim().max(5000, "A descrição excede 5000 caracteres.").nullable().optional(),
  sobreNos: z.string().trim().max(5000, "A descrição excede 5000 caracteres.").nullable().optional(),
  corPrincipal: z.string().regex(/^#[0-9a-fA-F]{6}$/, "A cor principal deve ser em formato hexadecimal (ex: #2563eb).").optional(),
});
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;

// ---- Cargos ----
export const cargoCreateSchema = z.object({
  name: z.string().trim().min(1, "O nome do cargo é obrigatório.").max(100, "O nome excede 100 caracteres."),
  description: z.string().trim().max(500, "A descrição excede 500 caracteres.").optional().nullable(),
  level: z.enum(CARGO_LEVELS).optional(),
  active: z.boolean().optional(),
});
export type CargoCreateInput = z.infer<typeof cargoCreateSchema>;
export const cargoUpdateSchema = cargoCreateSchema.partial();
export type CargoUpdateInput = z.infer<typeof cargoUpdateSchema>;

// ---- Subempresas/Organizações ----
export const subCompanyCreateSchema = z.object({
  name: z.string().trim().min(1, "O nome é obrigatório.").max(300, "O nome excede 300 caracteres."),
  type: z.enum(SUB_TYPES).optional(),
  sector: z.string().trim().max(200, "O sector excede 200 caracteres.").optional().nullable(),
  address: z.string().trim().max(500, "A morada excede 500 caracteres.").optional().nullable(),
  description: z.string().trim().max(2000, "A descrição excede 2000 caracteres.").optional().nullable(),
  active: z.boolean().optional(),
});
export type SubCompanyCreateInput = z.infer<typeof subCompanyCreateSchema>;
export const subCompanyUpdateSchema = subCompanyCreateSchema.partial();
export type SubCompanyUpdateInput = z.infer<typeof subCompanyUpdateSchema>;

// ---- Convites ----
export const inviteCreateSchema = z.object({
  email: z
    .union([z.literal(""), z.string().trim().email("O email não é válido.").max(255)])
    .optional()
    .nullable(),
  role: z.string().trim().max(50, "O cargo excede 50 caracteres.").optional().nullable(),
});
export type InviteCreateInput = z.infer<typeof inviteCreateSchema>;

// ---- Aquisição de empresa ----
export const companyAcquisitionSchema = z.object({
  action: z.enum(["redeem", "generate"], { message: "Acção inválida." }),
  code: z.string().trim().toUpperCase().max(20, "O código excede 20 caracteres.").optional().nullable(),
});
export type CompanyAcquisitionInput = z.infer<typeof companyAcquisitionSchema>;

// ---- Matriz de permissões ----
export const companyPermissionsSchema = z.object({
  matrix: z.record(z.record(z.boolean(), { message: "Permissões inválidas para um nível." }), { message: "Matriz de permissões inválida." }),
});
export type CompanyPermissionsInput = z.infer<typeof companyPermissionsSchema>;