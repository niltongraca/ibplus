import { z } from "zod";

// --- Login ---
export const loginSchema = z.object({
  email: z.string().trim().email("O email é inválido.").max(255, "O email excede 255 caracteres."),
  password: z.string().min(1, "Email e senha são obrigatórios.").max(200, "A senha excede 200 caracteres."),
});

export type LoginInput = z.infer<typeof loginSchema>;

// --- Alterar senha (autenticado) ---
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha actual e nova são obrigatórias.").max(200),
    newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres.").max(200),
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "A nova senha deve ser diferente da actual.",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// --- Atualizar perfil do utilizador ---
export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1, "O nome não pode ficar vazio.").max(200, "O nome excede 200 caracteres.").optional(),
  avatar: z.string().trim().max(5000, "O avatar excede o limite.").optional(),
  coverPhoto: z.string().trim().max(5000, "A foto de capa excede o limite.").optional(),
  phone: z.string().trim().max(50, "O telefone excede 50 caracteres.").optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// --- Recuperar senha ---
export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email inválido.").max(255),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// --- Repor senha com token ---
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "O token é obrigatório.").max(500),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres.").max(200),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;