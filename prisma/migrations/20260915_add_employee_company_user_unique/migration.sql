-- AddEmployeeCompanyUserUnique: elimina race do auto-dono (0 duplicados confirmados na Neon)
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_userId_key" UNIQUE ("companyId", "userId");