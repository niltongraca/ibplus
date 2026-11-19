-- AlterTable
ALTER TABLE "UpgradeRequest"
    ADD COLUMN "paymentMethod" TEXT,
    ADD COLUMN "paymentRef" TEXT,
    ADD COLUMN "paymentProofUrl" TEXT,
    ADD COLUMN "amount" DECIMAL(18,2);
