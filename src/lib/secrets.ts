export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  throw new Error(
    "JWT_SECRET não está definida. Gere uma com `node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"` e defina no ambiente (Vercel) e em .env. Nunca use segredos hardcoded.",
  );
}

export function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (key) return key;
  throw new Error(
    "ENCRYPTION_KEY não está definida. Gere uma com `node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"` e defina no ambiente (Vercel) e em .env. Nunca use chaves hardcoded.",
  );
}
