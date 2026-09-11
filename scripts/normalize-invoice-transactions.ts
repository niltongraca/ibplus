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
  const invoices = await prisma.invoice.findMany({
    where: {
      OR: [{ status: "paid" }, { paidAmount: { gt: 0 } }],
    },
    select: {
      id: true,
      companyId: true,
      number: true,
      total: true,
      paidAmount: true,
      status: true,
      date: true,
    },
    orderBy: { date: "asc" },
  });

  const transactions = await prisma.transaction.findMany({
    where: { refType: "invoice" },
    select: { refId: true },
  });
  const existingRefs = new Set(transactions.map((t) => t.refId).filter(Boolean));

  let created = 0;
  let adjusted = 0;
  let skipped = 0;

  for (const inv of invoices) {
    const paidAmount = inv.paidAmount.toNumber();
    const total = inv.total.toNumber();
    const legacyPaid = paidAmount === 0;
    const amount = paidAmount > 0 ? paidAmount : total;

    if (existingRefs.has(inv.id)) {
      skipped++;
      console.log(`- Já contabilizada: ${inv.number} (${amount} Kz)`);
      continue;
    }

    if (legacyPaid) {
      await prisma.invoice.update({
        where: { id: inv.id },
        data: {
          paidAmount: total,
          status: inv.status === "partially_paid" ? "paid" : inv.status,
        },
      });
      adjusted++;
    }

    await prisma.transaction.create({
      data: {
        companyId: inv.companyId,
        type: "income",
        description: `Pagamento da fatura ${inv.number}`,
        amount,
        refType: "invoice",
        refId: inv.id,
        date: inv.date,
      },
    });
    created++;
    console.log(`+ Contabilizada: ${inv.number} (${amount} Kz)`);
  }

  console.log(`\nResumo: ${created} transações criadas, ${adjusted} faturas ajustadas, ${skipped} já existentes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });