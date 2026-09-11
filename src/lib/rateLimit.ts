const rateMap = new Map<string, { count: number; resetAt: number }>();
const CLEANUP_INTERVAL_MS = 5 * 60_000;
let lastCleanupAt = Date.now();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const DEFAULTS: Record<string, RateLimitConfig> = {
  strict: { maxRequests: 5, windowMs: 60_000 },
  medium: { maxRequests: 10, windowMs: 60_000 },
  relaxed: { maxRequests: 30, windowMs: 60_000 },
};

export function getClientIp(request: Request): string {
  // x-real-ip é definido pela plataforma (Vercel/edge) e não pode ser forjado pelo cliente.
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Fallback: usa o último IP de x-forwarded-for (adicionado pelo proxy mais próximo da origem),
  // nunca o primeiro — o primeiro pode ser inventado pelo cliente.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((i) => i.trim()).filter(Boolean);
    if (ips.length > 0) return ips[ips.length - 1];
  }

  return "127.0.0.1";
}

function purgeExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;
  for (const [key, entry] of rateMap) {
    if (now > entry.resetAt) rateMap.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  tier: keyof typeof DEFAULTS = "relaxed"
): { allowed: boolean; retryAfter?: number } {
  purgeExpiredEntries();
  const config = DEFAULTS[tier];
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true };
  }

  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

export function rateLimitResponse(retryAfter: number) {
  return new Response(
    JSON.stringify({ error: "Demasiados pedidos. Tente novamente mais tarde." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}
