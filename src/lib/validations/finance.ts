import { z } from "zod";

// ---- Faturas e Orçamentos (DocumentForm) ----

// Item livre (descrição manual ou do catálogo) usado em faturas/orçamentos.
export const docItemSchema = z.object({
  description: z.string().trim().min(1, "A descrição de cada item é obrigatória.").max(500, "A descrição excede 500 caracteres."),
  quantity: z.coerce.number().int("A quantidade deve ser um número inteiro positivo.").positive("A quantidade deve ser um número inteiro positivo."),
  unitPrice: z.coerce.number().finite("O preço unitário não pode ser negativo.").min(0, "O preço unitário não pode ser negativo.").max(1e15),
  kind: z.enum(["product", "service"]).optional(),
});
export type DocItemInput = z.infer<typeof docItemSchema>;

// Campos de cliente comuns (campos vazios chegam como "" ou null — aceitam ambos).
const docCustomer = {
  customer: z.string().trim().max(500, "O cliente excede 500 caracteres.").optional().nullable(),
  customerEmail: z
    .union([z.literal(""), z.string().trim().email("O email do cliente é inválido.").max(255)])
    .optional()
    .nullable(),
  customerPhone: z.string().trim().max(50, "O telefone do cliente excede 50 caracteres.").optional().nullable(),
  customerNif: z.string().trim().max(50, "O NIF do cliente excede 50 caracteres.").optional().nullable(),
  notes: z.string().trim().max(5000, "As notas excedem 5000 caracteres.").optional().nullable(),
} as const;

// Campos financeiros comuns.
const docFinancial = {
  discountType: z.enum(["fixed", "percentage"]).optional(),
  discountValue: z.coerce.number().finite().min(0, "O desconto não pode ser negativo.").max(1e15).optional(),
  installments: z.coerce.number().int("As prestações devem ser inteiras.").min(1, "O número de prestações deve ser pelo menos 1.").max(1000).optional(),
  currency: z.string().trim().max(10, "A moeda excede 10 caracteres.").optional(),
  paymentMethod: z.string().trim().max(100, "O método de pagamento excede 100 caracteres.").optional().nullable(),
  bankDetails: z.string().trim().max(1000, "Os dados bancários excedem 1000 caracteres.").optional().nullable(),
} as const;

export const invoiceCreateSchema = z.object({
  ...docCustomer,
  ...docFinancial,
  status: z.enum(["paid", "partially_paid", "pending"]).optional(),
  dueDate: z.string().trim().max(50, "Data inválida.").nullable().optional(),
  paidAmount: z.coerce.number().finite().min(0).max(1e15).optional().nullable(),
  items: z.array(docItemSchema).min(1, "A fatura precisa de pelo menos um item.").max(500),
});
export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;

export const invoiceUpdateSchema = z.object({
  ...docCustomer,
  ...docFinancial,
  status: z.enum(["paid", "partially_paid", "pending"]).optional(),
  dueDate: z.string().trim().max(50, "Data inválida.").nullable().optional(),
  total: z.coerce.number().finite().min(0).max(1e15).optional(),
  subtotal: z.coerce.number().finite().min(0).max(1e15).optional(),
  paidAmount: z.coerce.number().finite().min(0).max(1e15).optional().nullable(),
  items: z.array(docItemSchema).min(1, "A fatura precisa de pelo menos um item.").max(500).optional(),
});
export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>;

export const quoteCreateSchema = z.object({
  ...docCustomer,
  ...docFinancial,
  status: z.enum(["pending", "approved"]).optional(),
  validUntil: z.string().trim().max(50, "Data inválida.").nullable().optional(),
  items: z.array(docItemSchema).min(1, "O orçamento precisa de pelo menos um item.").max(500),
});
export type QuoteCreateInput = z.infer<typeof quoteCreateSchema>;

export const quoteUpdateSchema = z.object({
  ...docCustomer,
  ...docFinancial,
  status: z.enum(["pending", "approved"]).optional(),
  validUntil: z.string().trim().max(50, "Data inválida.").nullable().optional(),
  subtotal: z.coerce.number().finite().min(0).max(1e15).optional(),
  items: z.array(docItemSchema).min(1, "O orçamento precisa de pelo menos um item.").max(500).optional(),
});
export type QuoteUpdateInput = z.infer<typeof quoteUpdateSchema>;

// ---- Despesas ----

export const expenseCreateSchema = z.object({
  description: z.string().trim().min(1, "A descrição é obrigatória.").max(500, "A descrição excede 500 caracteres."),
  amount: z.coerce.number().finite("O valor deve ser um número positivo.").positive("O valor deve ser um número positivo.").max(1e15),
  category: z.string().trim().max(100, "A categoria excede 100 caracteres.").optional().nullable(),
  date: z.string().trim().max(50, "Data inválida.").optional().nullable(),
  paid: z.boolean().optional(),
  notes: z.string().trim().max(2000, "As notas excedem 2000 caracteres.").optional().nullable(),
});
export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;

// No PUT todos os campos são opcionais; .partial() mantém as regras por campo.
export const expenseUpdateSchema = expenseCreateSchema.partial();
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;

// ---- Vendas ----

export const saleItemSchema = z.object({
  productId: z.string().min(1, "Cada item deve ter um produto.").max(200, "Produto inválido."),
  quantity: z.coerce.number().int("Cada item deve ter uma quantidade inteira positiva.").positive("Cada item deve ter uma quantidade inteira positiva.").max(1e9),
});
export type SaleItemInput = z.infer<typeof saleItemSchema>;

export const saleCreateSchema = z.object({
  customerId: z.string().max(100).optional().nullable(),
  paymentMethod: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  items: z.array(saleItemSchema).min(1, "A venda deve conter pelo menos um item.").max(500),
});
export type SaleCreateInput = z.infer<typeof saleCreateSchema>;

export const saleUpdateSchema = z.object({
  customerId: z.string().max(100).optional().nullable(),
  status: z.string().trim().max(50).optional(),
  paymentMethod: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  items: z.array(saleItemSchema).min(1, "A venda deve conter pelo menos um item.").max(500).optional(),
});
export type SaleUpdateInput = z.infer<typeof saleUpdateSchema>;

// ---- Compras ----

export const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Cada item deve ter um produto.").max(200, "Produto inválido."),
  quantity: z.coerce.number().int("Cada item deve ter uma quantidade inteira positiva.").positive("Cada item deve ter uma quantidade inteira positiva.").max(1e9),
  unitPrice: z.coerce.number().finite().min(0, "O preço unitário deve ser um número não negativo.").max(1e15).optional().nullable(),
});
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;

export const purchaseCreateSchema = z.object({
  supplier: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  items: z.array(purchaseItemSchema).min(1, "A compra deve conter pelo menos um item.").max(500),
});
export type PurchaseCreateInput = z.infer<typeof purchaseCreateSchema>;

export const purchaseUpdateSchema = z.object({
  supplier: z.string().trim().max(500).optional().nullable(),
  status: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  items: z.array(purchaseItemSchema).min(1, "A compra deve conter pelo menos um item.").max(500).optional(),
});
export type PurchaseUpdateInput = z.infer<typeof purchaseUpdateSchema>;