import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import WebSocket from "ws";

neonConfig.webSocketConstructor = WebSocket as any;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const dup = await prisma.$queryRaw`
    SELECT "companyId", "userId", COUNT(*)::int AS n
    FROM "Employee"
    WHERE "userId" IS NOT NULL
    GROUP BY "companyId", "userId"
    HAVING COUNT(*) > 1
  `;
  const totalArr = await prisma.$queryRaw`SELECT COUNT(*)::int AS c FROM "Employee"`;
  const ownersArr = await prisma.$queryRaw`SELECT COUNT(*)::int AS c FROM "Employee" WHERE "isOwner" = true`;

  const total = (totalArr as { c: number }[])[0]?.c ?? 0;
  const owners = (ownersArr as { c: number }[])[0]?.c ?? 0;
  const duplicates = dup as { companyId: string; userId: string; n: number }[];

  console.log(`Total Employee: ${total}`);
  console.log(`Total isOwner=true: ${owners}`);
  console.log(`Linhas duplicadas (companyId,userId): ${duplicates.length}`);
  if (duplicates.length > 0) {
    for (const d of duplicates) {
      console.log(`  companyId=${d.companyId}  userId=${d.userId}  n=${d.n}`);
    }
  } else {
    console.log("SEM duplicados. Constraint @@unique([companyId, userId]) pode ser aplicada sem perda de dados.");
  }
}

main()
  .catch((e) => {
    console.error("ERRO:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
