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

/** Registers or syncs a single income transaction reflecting the paid amount of an invoice. */
export async function recordInvoicePayment(companyId: string, invoiceId: string, number: string, amount: number): Promise<void> {
  const existing = await prisma.transaction.findFirst({
    where: { companyId, refType: "invoice", refId: invoiceId },
  });
  if (existing) {
    if (existing.amount !== amount) {
      await prisma.transaction.update({ where: { id: existing.id }, data: { amount } });
      await logAction("update", "payment", invoiceId, `Pagamento da fatura ${number} atualizado para ${amount} Kz`);
    } else {
      return;
    }
  } else {
    await recordTransaction(companyId, {
      type: "income",
      description: `Pagamento da fatura ${number}`,
      amount,
      refType: "invoice",
      refId: invoiceId,
    });
    await logAction("create", "payment", invoiceId, `Pagamento da fatura ${number} (${amount} Kz) contabilizado`);
  }
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

/** Registers or syncs a single expense transaction reflecting the paid amount of an approved expense. */
export async function recordExpensePayment(companyId: string, expenseId: string, description: string, amount: number): Promise<void> {
  const existing = await prisma.transaction.findFirst({
    where: { companyId, refType: "expense", refId: expenseId },
  });
  const label = description || "Despesa";
  if (existing) {
    if (existing.amount !== amount) {
      await prisma.transaction.update({ where: { id: existing.id }, data: { amount } });
      await logAction("update", "payment", expenseId, `Despesa "${label}" atualizada para ${amount} Kz nos fundos`);
    } else {
      return;
    }
  } else {
    await recordTransaction(companyId, {
      type: "expense",
      description: `Despesa: ${label}`,
      amount,
      refType: "expense",
      refId: expenseId,
    });
    await logAction("create", "payment", expenseId, `Despesa "${label}" (${amount} Kz) deduzida dos fundos`);
  }
  await createNotification(companyId, "finance", `Despesa paga`, `Foi deduzido ${amount} Kz dos fundos — "${label}".`, "/gestao/despesas");
}

export async function revertExpensePayment(companyId: string, expenseId: string, description: string): Promise<void> {
  const existing = await prisma.transaction.findFirst({
    where: { companyId, refType: "expense", refId: expenseId },
  });
  if (!existing) return;

  await removeTransactionsByRef(companyId, "expense", expenseId);
  await logAction("update", "payment", expenseId, `Despesa "${description || "Despesa"}" revertida (deixou de estar paga)`);
}