-- Migration: money as Decimal(18,2)
-- Converte campos monetários de DOUBLE PRECISION para NUMERIC(18,2).
-- Gerado manualmente (BD inacessível a partir do ambiente de desenvolvimento).
-- Aplicar com: prisma migrate deploy   (ou psql -f migration.sql)

-- AlterTable
ALTER TABLE "Opportunity" ALTER COLUMN "value" SET DATA TYPE NUMERIC(18,2) USING "value"::NUMERIC(18,2);

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "price" SET DATA TYPE NUMERIC(18,2) USING "price"::NUMERIC(18,2);
ALTER TABLE "Product" ALTER COLUMN "cost" SET DATA TYPE NUMERIC(18,2) USING "cost"::NUMERIC(18,2);

-- AlterTable
ALTER TABLE "Sale" ALTER COLUMN "total" SET DATA TYPE NUMERIC(18,2) USING "total"::NUMERIC(18,2);

-- AlterTable
ALTER TABLE "SaleItem" ALTER COLUMN "unitPrice" SET DATA TYPE NUMERIC(18,2) USING "unitPrice"::NUMERIC(18,2);
ALTER TABLE "SaleItem" ALTER COLUMN "total" SET DATA TYPE NUMERIC(18,2) USING "total"::NUMERIC(18,2);

-- AlterTable
ALTER TABLE "Purchase" ALTER COLUMN "total" SET DATA TYPE NUMERIC(18,2) USING "total"::NUMERIC(18,2);

-- AlterTable
ALTER TABLE "PurchaseItem" ALTER COLUMN "unitPrice" SET DATA TYPE NUMERIC(18,2) USING "unitPrice"::NUMERIC(18,2);
ALTER TABLE "PurchaseItem" ALTER COLUMN "total" SET DATA TYPE NUMERIC(18,2) USING "total"::NUMERIC(18,2);

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "amount" SET DATA TYPE NUMERIC(18,2) USING "amount"::NUMERIC(18,2);

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "subtotal" SET DATA TYPE NUMERIC(18,2) USING "subtotal"::NUMERIC(18,2);
ALTER TABLE "Invoice" ALTER COLUMN "discountValue" SET DATA TYPE NUMERIC(18,2) USING "discountValue"::NUMERIC(18,2);
ALTER TABLE "Invoice" ALTER COLUMN "discount" SET DATA TYPE NUMERIC(18,2) USING "discount"::NUMERIC(18,2);
ALTER TABLE "Invoice" ALTER COLUMN "total" SET DATA TYPE NUMERIC(18,2) USING "total"::NUMERIC(18,2);
ALTER TABLE "Invoice" ALTER COLUMN "paidAmount" SET DATA TYPE NUMERIC(18,2) USING "paidAmount"::NUMERIC(18,2);

-- AlterTable
ALTER TABLE "InvoiceItem" ALTER COLUMN "unitPrice" SET DATA TYPE NUMERIC(18,2) USING "unitPrice"::NUMERIC(18,2);
ALTER TABLE "InvoiceItem" ALTER COLUMN "total" SET DATA TYPE NUMERIC(18,2) USING "total"::NUMERIC(18,2);

-- AlterTable
ALTER TABLE "Quote" ALTER COLUMN "subtotal" SET DATA TYPE NUMERIC(18,2) USING "subtotal"::NUMERIC(18,2);
ALTER TABLE "Quote" ALTER COLUMN "discountValue" SET DATA TYPE NUMERIC(18,2) USING "discountValue"::NUMERIC(18,2);
ALTER TABLE "Quote" ALTER COLUMN "discount" SET DATA TYPE NUMERIC(18,2) USING "discount"::NUMERIC(18,2);
ALTER TABLE "Quote" ALTER COLUMN "total" SET DATA TYPE NUMERIC(18,2) USING "total"::NUMERIC(18,2);

-- AlterTable
ALTER TABLE "QuoteItem" ALTER COLUMN "unitPrice" SET DATA TYPE NUMERIC(18,2) USING "unitPrice"::NUMERIC(18,2);
ALTER TABLE "QuoteItem" ALTER COLUMN "total" SET DATA TYPE NUMERIC(18,2) USING "total"::NUMERIC(18,2);

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "price" SET DATA TYPE NUMERIC(18,2) USING "price"::NUMERIC(18,2);

-- AlterTable
ALTER TABLE "Campaign" ALTER COLUMN "budget" SET DATA TYPE NUMERIC(18,2) USING "budget"::NUMERIC(18,2);

-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "salary" SET DATA TYPE NUMERIC(18,2) USING "salary"::NUMERIC(18,2);

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "amount" SET DATA TYPE NUMERIC(18,2) USING "amount"::NUMERIC(18,2);

-- AlterTable
ALTER TABLE "Report" ALTER COLUMN "totalRevenue" SET DATA TYPE NUMERIC(18,2) USING "totalRevenue"::NUMERIC(18,2);
ALTER TABLE "Report" ALTER COLUMN "totalExpenses" SET DATA TYPE NUMERIC(18,2) USING "totalExpenses"::NUMERIC(18,2);
ALTER TABLE "Report" ALTER COLUMN "netResult" SET DATA TYPE NUMERIC(18,2) USING "netResult"::NUMERIC(18,2);
ALTER TABLE "Report" ALTER COLUMN "invoicesPaidTotal" SET DATA TYPE NUMERIC(18,2) USING "invoicesPaidTotal"::NUMERIC(18,2);