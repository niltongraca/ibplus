import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import {
  CARGO_LEVELS,
  DEFAULT_FEATURE_PERMISSIONS,
  DELETE_LEVELS,
  FEATURE_KEYS,
  TEAM_MANAGE_LEVELS,
  WRITE_LEVELS,
  type CargoLevel,
  type FeatureKey,
} from "@/config/permissions";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  accountType: string;
  plan: string;
  companyId: string | null;
  role: string;
  tokenVersion: number;
  isOwner: boolean;
  cargoLevel: CargoLevel | null;
}

function asLevel(level: string | null | undefined): CargoLevel {
  if (level && CARGO_LEVELS.includes(level as CargoLevel)) return level as CargoLevel;
  return "viewer";
}

export async function getCompanyFeatureAccess(
  companyId: string,
  cargoLevel: CargoLevel
): Promise<Record<FeatureKey, boolean>> {
  const base: Record<FeatureKey, boolean> = { ...DEFAULT_FEATURE_PERMISSIONS[cargoLevel] };
  const rows = await prisma.cargoPermission.findMany({ where: { companyId, cargoLevel } });
  for (const row of rows) {
    if (row.feature in base) base[row.feature as FeatureKey] = row.access;
  }
  return base;
}

export async function getCompanyAccessMatrix(
  companyId: string
): Promise<Record<CargoLevel, Record<FeatureKey, boolean>>> {
  const matrix: Record<CargoLevel, Record<FeatureKey, boolean>> = {
    owner: { ...DEFAULT_FEATURE_PERMISSIONS.owner },
    manager: { ...DEFAULT_FEATURE_PERMISSIONS.manager },
    collaborator: { ...DEFAULT_FEATURE_PERMISSIONS.collaborator },
    viewer: { ...DEFAULT_FEATURE_PERMISSIONS.viewer },
  };
  const rows = await prisma.cargoPermission.findMany({ where: { companyId } });
  for (const row of rows) {
    const level = asLevel(row.cargoLevel);
    if (row.feature in matrix[level]) matrix[level][row.feature as FeatureKey] = row.access;
  }
  return matrix;
}

export async function getEffectiveFeatureList(
  companyId: string | null | undefined,
  cargoLevel: CargoLevel | null | undefined
): Promise<FeatureKey[]> {
  if (!companyId || !cargoLevel) return [...FEATURE_KEYS];
  const access = await getCompanyFeatureAccess(companyId, cargoLevel);
  return FEATURE_KEYS.filter((f) => access[f]);
}

export function canWriteLevel(cargoLevel: CargoLevel | null | undefined): boolean {
  return WRITE_LEVELS.includes(asLevel(cargoLevel ?? null));
}

export function canDeleteLevel(cargoLevel: CargoLevel | null | undefined): boolean {
  return DELETE_LEVELS.includes(asLevel(cargoLevel ?? null));
}

function denied(message = "Não tem permissão para aceder a esta área."): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Requer que o utilizador tenha a feature na matriz efetiva da empresa.
 * Retorna null se autorizado (ou se for solista/admin).
 * Contas antigas sem cargo atribuído não são restringidas (igual ao middleware,
 * que também não as restringe); a restrição aplica-se só a quem tem cargo.
 */
export async function requireFeature(user: AuthUser, feature: FeatureKey): Promise<NextResponse | null> {
  if (user.role === "admin" || !user.companyId) return null;
  if (!user.cargoLevel) return null;
  const access = await getCompanyFeatureAccess(user.companyId, user.cargoLevel);
  if (!access[feature]) return denied();
  return null;
}

/** Feature + nível de escrita (owner/manager/collaborator) */
export async function requireWrite(user: AuthUser, feature: FeatureKey): Promise<NextResponse | null> {
  const res = await requireFeature(user, feature);
  if (res) return res;
  if (user.role !== "admin" && !canWriteLevel(user.cargoLevel)) return denied();
  return null;
}

/** Feature + nível de eliminação (owner/manager) */
export async function requireDelete(user: AuthUser, feature: FeatureKey): Promise<NextResponse | null> {
  const res = await requireFeature(user, feature);
  if (res) return res;
  if (user.role !== "admin" && !canDeleteLevel(user.cargoLevel)) return denied();
  return null;
}

/** Gestão de equipa (funcionários/férias/presenças): owner/manager */
export async function requireTeamManage(user: AuthUser, feature: FeatureKey = "rh"): Promise<NextResponse | null> {
  const res = await requireFeature(user, feature);
  if (res) return res;
  if (user.role !== "admin" && !TEAM_MANAGE_LEVELS.includes(asLevel(user.cargoLevel))) return denied();
  return null;
}

/** Apenas o dono gere cargos/configuração da empresa */
export async function requireOwner(user: AuthUser, message = "Apenas o dono pode gerir esta configuração."): Promise<NextResponse | null> {
  if (user.role === "admin") return null;
  if (!user.isOwner) return denied(message);
  return null;
}