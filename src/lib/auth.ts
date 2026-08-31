import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { getJwtSecret } from "./secrets";

export interface JwtPayload {
  userId: string;
  companyId: string | null;
  email: string;
  role: string;
  accountType: string;
  plan: string;
  tokenVersion: number;
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
    select: { id: true, name: true, email: true, phone: true, avatar: true, accountType: true, plan: true, companyId: true, role: true, tokenVersion: true },
  });

  if (!user) return null;

  if (payload.tokenVersion !== user.tokenVersion) {
    return null;
  }

  return user;
}
