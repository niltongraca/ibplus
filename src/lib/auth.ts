// Auth JWT unificada em **jose** (HS256, mesmo secret que o middleware).
// Antes: auth.ts usava jsonwebtoken e middleware.ts usava jose → duas libs e
// dois caminhos de validação que podiam divergir. Agora só existe jose, com a
// mesma chave (TextEncoder sobre JWT_SECRET) e o mesmo algoritmo em ambos os
// runtimes (Node e Edge). Tokens emitidos antes da migração (jsonwebtoken,
// HS256, mesmo secret) continuam a ser verificados — sem logout forçado.
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { getJwtSecret } from "./secrets";
import { ensureCompanyOwner } from "./ownership";
import type { CargoLevel } from "@/config/permissions";

export interface JwtPayload {
  userId: string;
  companyId: string | null;
  email: string;
  role: string;
  accountType: string;
  plan: string;
  tokenVersion: number;
  cargoLevel: string | null;
}

const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias (alinhado com o cookie)

function jwtKey(): Uint8Array {
  return new TextEncoder().encode(getJwtSecret());
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    // jose: setExpirationTime com número é um timestamp Unix ABSOLUTO
    // (não duração como o antigo jsonwebtoken expiresIn). O valor 604800 cru
    // era interpretado como 1970-01-08 => "exp" sempre no passado => todos os
    // tokens rejeitados pelo middleware/apis (regressão da migração jose).
    .setExpirationTime(Math.floor(Date.now() / 1000) + TOKEN_MAX_AGE_SECONDS)
    .sign(jwtKey());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtKey());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ibplus_session")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
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