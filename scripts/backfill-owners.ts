import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  const companies = await prisma.company.findMany({ select: { id: true, name: true } });

  for (const company of companies) {
    const owner = await prisma.employee.findFirst({ where: { companyId: company.id, isOwner: true } });
    if (owner) {
      console.log(`[skip] ${company.name}: já tem dono (${owner.name})`);
      continue;
    }
    const ownerCargo = await prisma.cargo.findFirst({ where: { companyId: company.id, level: "owner" } });
    const cargo = ownerCargo ?? (await prisma.cargo.create({
      data: { companyId: company.id, name: "Dono", level: "owner", isDefault: false },
    }));
    const user = await prisma.user.findFirst({ where: { companyId: company.id } });
    if (!user) {
      console.log(`[skip] ${company.name}: sem utilizador com companyId, sem dono a atribuir`);
      continue;
    }
    await prisma.employee.create({
      data: {
        companyId: company.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        position: "Dono",
        cargoId: cargo.id,
        isOwner: true,
        active: true,
      },
    });
    console.log(`[fix] ${company.name}: ${user.name} agora é dono (cargo: ${cargo.name})`);
  }

  const leftover = await prisma.subCompany.findMany({ where: { name: "Smoke Test FL" } });
  if (leftover.length) {
    await prisma.subCompany.deleteMany({ where: { name: "Smoke Test FL" } });
    console.log(`[cleanup] removidas ${leftover.length} subempresas de smoke test`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Falhou:", err?.message || err);
  process.exit(1);
});