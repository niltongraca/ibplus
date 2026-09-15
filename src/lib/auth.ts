import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { getJwtSecret } from "./secrets";
import { ensureCompanyOwner } from "./ownership";
import type { CargoLevel } from "@/config/permissions";

interface JwtPayload {
  userId: string;
  companyId: string | null;
  email: string;
  role: string;
  accountType: string;
  plan: string;
  tokenVersion: number;
  cargoLevel: string | null;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ibplus_session")?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true, name: true, email: true, phone: true, avatar: true, coverPhoto: true, accountType: true, plan: true, companyId: true, role: true, tokenVersion: true,
      employees: { select: { isOwner: true, cargo: { select: { level: true } } }, take: 1, orderBy: { isOwner: "desc" } },
    },
  });

  if (!user) return null;

  const { employees, ...rest } = user;

  if (payload.tokenVersion !== user.tokenVersion) {
    return null;
  }

  // Utilizador com empresa mas sem qualquer registo de funcionário (conta antiga
  // ou solista) → passa a dono automaticamente.
  let ownerInfo = { isOwner: employees[0]?.isOwner ?? false, cargoLevel: (employees[0]?.cargo?.level ?? null) as CargoLevel | null };
  if (rest.companyId && employees.length === 0) {
    ownerInfo = await ensureCompanyOwner({ id: rest.id, name: rest.name, email: rest.email, phone: rest.phone, companyId: rest.companyId });
  }

  return {
    ...rest,
    isOwner: ownerInfo.isOwner,
    cargoLevel: ownerInfo.cargoLevel,
  };
}
