const rateMap = new Map<string, { count: number; resetAt: number }>();

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
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

export function checkRateLimit(
  key: string,
  tier: keyof typeof DEFAULTS = "relaxed"
): { allowed: boolean; retryAfter?: number } {
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
