import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import WebSocket from "ws";
import { readFileSync } from "fs";
import { createHash } from "crypto";

neonConfig.webSocketConstructor = WebSocket as any;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

const migrationName = "20260915_add_employee_company_user_unique";

async function main() {
  const realSql = readFileSync(
    `prisma/migrations/${migrationName}/migration.sql`,
    "utf8",
  );
  const realChecksum = createHash("sha256").update(realSql).digest("hex");

  console.log("CHECKSUM REAL (sha256 do migration.sql):", realChecksum);

  const migr = (await prisma.$queryRaw`
    SELECT "migration_name"::text AS name, "checksum"::text AS chk
    FROM "_prisma_migrations"
    WHERE "migration_name" = ${migrationName}
  `) as { name: string; chk: string }[];

  const robj = migr[0];
  console.log("CHECKSUM NA NEON:                         ", robj?.chk);

  const cons = (await prisma.$queryRaw`
    SELECT conname::text AS name, contype::text AS type
    FROM pg_constraint
    WHERE conrelid = 'public."Employee"'::regclass
      AND conname = 'Employee_companyId_userId_key'
  `) as { name: string; type: string }[];

  console.log("Constraint UNIQUE na Neon:", JSON.stringify(cons));

  const ok = robj?.chk === realChecksum && cons.length > 0 && cons[0]?.type === "u";
  console.log(ok ? "OK: migracao registada com checksum correcto e constraint presente." : "INCONSISTENTE: rever (ver sumario acima).");
  if (!ok) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error("ERRO:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
