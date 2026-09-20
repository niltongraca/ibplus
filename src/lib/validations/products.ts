import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(1, "O nome é obrigatório.").max(200, "O nome excede 200 caracteres."),
  description: z.string().trim().max(5000, "A descrição excede 5000 caracteres.").optional().nullable(),
  price: z.coerce.number().finite().positive("O preço deve ser um número positivo."),
  cost: z.coerce.number().finite().min(0, "O custo não pode ser negativo.").optional().nullable(),
  stock: z.coerce.number().int("O stock deve ser um número inteiro.").min(0, "O stock não pode ser negativo.").optional().nullable(),
  minStock: z.coerce.number().int("O stock mínimo deve ser um número inteiro.").min(0, "O stock mínimo não pode ser negativo.").optional().nullable(),
  unit: z.string().trim().max(10, "A unidade excede 10 caracteres.").optional().default("un"),
  categoryId: z.string().length(24, "Categoria inválida.").optional().nullable(),
  active: z.boolean().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

export function validateProduct(body: unknown) {
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Dados inválidos." };
  }
  return { data: parsed.data };
}
