import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

export interface TransactionInput {
  type: "income" | "expense";
  description: string;
  amount: number;
  refType?: string | null;
  refId?: string | null;
  date?: Date;
}

export async function recordTransaction(companyId: string, input: TransactionInput): Promise<void> {
  await prisma.transaction.create({
    data: {
      companyId,
      type: input.type,
      description: input.description,
      amount: input.amount,
      refType: input.refType ?? null,
      refId: input.refId ?? null,
      date: input.date ?? new Date(),
    },
  });
}

export async function removeTransactionsByRef(companyId: string, refType: string, refId: string): Promise<void> {
  await prisma.transaction.deleteMany({ where: { companyId, refType, refId } });
}

export async function recordInvoicePayment(companyId: string, invoiceId: string, number: string, amount: number): Promise<void> {
  const existing = await prisma.transaction.findFirst({
    where: { companyId, refType: "invoice", refId: invoiceId },
  });
  if (existing) return;

  await recordTransaction(companyId, {
    type: "income",
    description: `Pagamento da fatura ${number}`,
    amount,
    refType: "invoice",
    refId: invoiceId,
  });
  await logAction("create", "payment", invoiceId, `Pagamento da fatura ${number} (${amount}) contabilizado`);
  await createNotification(companyId, "finance", `Fatura ${number} paga`, `Foi recebido ${amount} Kz e contabilizado nos fundos.`, "/finance/contas-receber");
}

export async function revertInvoicePayment(companyId: string, invoiceId: string, number: string): Promise<void> {
  const existing = await prisma.transaction.findFirst({
    where: { companyId, refType: "invoice", refId: invoiceId },
  });
  if (!existing) return;

  await removeTransactionsByRef(companyId, "invoice", invoiceId);
  await logAction("update", "payment", invoiceId, `Pagamento da fatura ${number} revertido (deixou de ser paga)`);
}