import { prisma } from "./prisma";
import type { User } from "@prisma/client";

export interface OwnerInfo {
  isOwner: boolean;
  cargoLevel: "owner" | null;
}

/**
 * Garante que o utilizador que registou/possui uma empresa tem o cargo de dono
 * (employee com isOwner=true e cargo de nível owner).
 *
 * Utilizadores antigos sem qualquer registo de funcionário (legacy) e solistas
 * (EMPREENDEDOR) passam a dono automaticamente. Quem já tem um registo de
 * funcionário na empresa (ex.: convidados) não é promovido, e não se criam
 * donos duplicados quando a empresa já tem outro dono.
 */
export async function ensureCompanyOwner(
  user: Pick<User, "id" | "name" | "email" | "phone" | "companyId">
): Promise<OwnerInfo> {
  if (!user.companyId) return { isOwner: false, cargoLevel: null };

  const employee = await prisma.employee.findFirst({
    where: { companyId: user.companyId, userId: user.id },
    select: { isOwner: true, cargo: { select: { level: true } } },
  });
  if (employee) {
    return { isOwner: employee.isOwner, cargoLevel: employee.cargo?.level === "owner" ? "owner" : null };
  }

  const otherOwner = await prisma.employee.findFirst({
    where: { companyId: user.companyId, isOwner: true, NOT: { userId: user.id } },
    select: { id: true },
  });
  if (otherOwner) return { isOwner: false, cargoLevel: null };

  const ownerCargo = await prisma.cargo.findFirst({ where: { companyId: user.companyId, level: "owner" } });
  const cargo = ownerCargo ?? (await prisma.cargo.upsert({
    where: { companyId_name: { companyId: user.companyId, name: "Dono" } },
    update: { level: "owner" }, // se existir um cargo "Dono" com outro nível, corrige
    create: { companyId: user.companyId, name: "Dono", level: "owner", isDefault: false },
  }));

  await prisma.employee.createMany({
    data: {
      companyId: user.companyId,
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      position: "Dono",
      cargoId: cargo.id,
      isOwner: true,
      active: true,
    },
    skipDuplicates: true, // idempotente: ignora se já existe um funcionário idêntico
  });

  return { isOwner: true, cargoLevel: "owner" };
}