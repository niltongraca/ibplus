-- CreateTable
CREATE TABLE "SubCompany" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SUBEMPRESA',
    "sector" TEXT,
    "address" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubCompany_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Company" ADD COLUMN "acquisitionCode" TEXT;

-- CreateIndex
CREATE INDEX "SubCompany_companyId_idx" ON "SubCompany"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_acquisitionCode_key" ON "Company"("acquisitionCode");

-- AddForeignKey
ALTER TABLE "SubCompany" ADD CONSTRAINT "SubCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;