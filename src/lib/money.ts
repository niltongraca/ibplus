import type { Prisma } from "@prisma/client";

export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") return Number(value) || 0;
  if (typeof value === "object" && typeof (value as Prisma.Decimal).toNumber === "function") {
    return (value as Prisma.Decimal).toNumber();
  }
  return 0;
}

export function toMoney(value: unknown): number {
  return toNumber(value);
}