const isProduction = process.env.NODE_ENV === "production";

const DEV_JWT_FALLBACK = "ibplus-dev-secret-change-in-production";
const DEV_ENCRYPTION_FALLBACK = "ibplus-default-key-change-in-production-32chars";

export function getJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (!isProduction) return DEV_JWT_FALLBACK;
  throw new Error("JWT_SECRET não está definida em produção. Configure a variável de ambiente.");
}

export function getEncryptionKey(): string {
  if (process.env.ENCRYPTION_KEY) return process.env.ENCRYPTION_KEY;
  if (!isProduction) return DEV_ENCRYPTION_FALLBACK;
  throw new Error("ENCRYPTION_KEY não está definida em produção. Configure a variável de ambiente.");
}
