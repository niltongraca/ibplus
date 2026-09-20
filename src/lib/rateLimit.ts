import { getKvClient, type KvClient } from "./kv";

// Rate limit com backend persistente (Upstash/Vercel KV) quando configurado —
// em serverless o Map em memória reinicia a cada cold start e é inútil em
// escala. Sem KV configurado (dev/local), usa o Map em memória (fallback).

const rateMap = new Map<string, { count: number; resetAt: number }>();
const CLEANUP_INTERVAL_MS = 5 * 60_000;
let lastCleanupAt = Date.now();

export interface RateLimitConfig {
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

export type RateLimitCheck = { allowed: boolean; retryAfter?: number };

export async function checkRateLimit(
  key: string,
  tier: keyof typeof DEFAULTS = "relaxed"
): Promise<RateLimitCheck> {
  const config = DEFAULTS[tier];
  const kv = getKvClient();
  if (kv) {
    try {
      return await checkRateLimitKv(kv, key, config);
    } catch {
      // KV indisponível (rede/erro) — degradação graciosa para memória.
    }
  }
  return checkRateLimitMemory(key, config);
}

function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig
): RateLimitCheck {
  purgeExpiredEntries();
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

// Janela deslizante simples sobre Redis: INCR + EXPIRE (renova a janela a cada
// pedido, como o Map em memória). Quando o limite é excedido, o retryAfter é o
// TTL restante da chave.
async function checkRateLimitKv(
  kv: KvClient,
  key: string,
  config: RateLimitConfig
): Promise<RateLimitCheck> {
  const windowSec = Math.ceil(config.windowMs / 1000);

  const [incrResult] = await kv.pipeline([
    ["INCR", key],
    ["EXPIRE", key, String(windowSec)],
  ]);
  const count = normalizeResult(incrResult);

  if (typeof count === "number" && count <= config.maxRequests) {
    return { allowed: true };
  }

  const [ttlResult] = await kv.pipeline([["TTL", key]]);
  const ttl = normalizeResult(ttlResult);
  const retryAfter =
    typeof ttl === "number" && ttl > 0 ? ttl : Math.max(1, windowSec);
  return { allowed: false, retryAfter };
}

// Aceita respostas no formato `[resultado]` ou `[{ result: resultado }]`.
function normalizeResult(value: unknown): unknown {
  if (value && typeof value === "object" && "result" in value) {
    return (value as { result: unknown }).result;
  }
  return value;
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