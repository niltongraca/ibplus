-- CreateTable
CREATE TABLE "CargoPermission" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "cargoLevel" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "access" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CargoPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CargoPermission_companyId_cargoLevel_feature_key" ON "CargoPermission"("companyId", "cargoLevel", "feature");

-- CreateIndex
CREATE INDEX "CargoPermission_cargoLevel_feature_idx" ON "CargoPermission"("cargoLevel", "feature");

-- AddForeignKey
ALTER TABLE "CargoPermission" ADD CONSTRAINT "CargoPermission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;