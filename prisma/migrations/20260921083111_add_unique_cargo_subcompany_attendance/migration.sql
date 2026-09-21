-- AlterTable
ALTER TABLE "Invite" ALTER COLUMN "accountType" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_employeeId_date_key" ON "Attendance"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Cargo_companyId_name_key" ON "Cargo"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SubCompany_companyId_name_key" ON "SubCompany"("companyId", "name");