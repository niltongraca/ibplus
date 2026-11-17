-- CreateEnum
CREATE TYPE "UpgradePaymentStatus" AS ENUM ('NONE', 'PENDING', 'PAID', 'FAILED');

-- AlterTable
ALTER TABLE "UpgradeRequest"
    ADD COLUMN "paymentStatus" "UpgradePaymentStatus" NOT NULL DEFAULT 'NONE',
    ADD COLUMN "stripeSessionId" TEXT,
    ADD COLUMN "stripeSubscriptionId" TEXT,
    ADD COLUMN "paidAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "UpgradeRequest_stripeSessionId_key" ON "UpgradeRequest"("stripeSessionId");
