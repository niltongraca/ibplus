import type { Prisma } from "@prisma/client";

const ADVISORY_LOCK_TAG = "ibplus-doc-seq-v1";

async function nextDocumentNumber(
  tx: Prisma.TransactionClient,
  companyId: string,
  prefix: "FAT" | "ORC",
  model: "invoice" | "quote"
): Promise<string> {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${ADVISORY_LOCK_TAG}:${prefix}:${companyId}`}, 0))::text`;
  const count =
    model === "invoice"
      ? await tx.invoice.count({ where: { companyId } })
      : await tx.quote.count({ where: { companyId } });
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `${prefix}-${dateStr}-${String(count + 1).padStart(4, "0")}`;
}

export function nextInvoiceNumber(tx: Prisma.TransactionClient, companyId: string): Promise<string> {
  return nextDocumentNumber(tx, companyId, "FAT", "invoice");
}

export function nextQuoteNumber(tx: Prisma.TransactionClient, companyId: string): Promise<string> {
  return nextDocumentNumber(tx, companyId, "ORC", "quote");
}