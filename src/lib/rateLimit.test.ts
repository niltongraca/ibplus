import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { checkRateLimit, getClientIp, rateLimitResponse } from "./rateLimit";
import { resetKvClientCache } from "./kv";

function setKvEnv(enabled: boolean): void {
  if (enabled) {
    process.env.KV_REST_API_URL = "https://mock.upstash.io";
    process.env.KV_REST_API_TOKEN = "mock-token";
  } else {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  }
  resetKvClientCache();
}

describe("checkRateLimit — backend em memória (fallback)", () => {
  beforeEach(() => {
    setKvEnv(false);
  });

  it("permite os primeiros pedidos e bloqueia a partir do máximo (strict=5)", async () => {
    for (let i = 0; i < 5; i++) {
      assert.equal((await checkRateLimit("mem:strict-1", "strict")).allowed, true);
    }
    const blocked = await checkRateLimit("mem:strict-1", "strict");
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfter! >= 1 && blocked.retryAfter! <= 60);
  });

  it("usa janelas independentes por chave", async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit("mem:a", "strict");
    }
    assert.equal((await checkRateLimit("mem:b", "strict")).allowed, true);
  });

  it("por omissão usa o tier relaxed", async () => {
    assert.equal((await checkRateLimit("mem:relaxed-1")).allowed, true);
  });
});

describe("checkRateLimit — backend KV persistente", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    setKvEnv(false);
  });

  function statefulMock() {
    const counters = new Map<string, number>();
    const ttls = new Map<string, number>();
    const calls: string[][][] = [];
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      const commands = JSON.parse(String(init?.body)) as string[][];
      calls.push(commands);
      const out: unknown[] = commands.map(([cmd, key, arg]) => {
        if (cmd === "INCR") {
          const next = (counters.get(key) ?? 0) + 1;
          counters.set(key, next);
          return next;
        }
        if (cmd === "EXPIRE") {
          ttls.set(key, Number(arg));
          return 1;
        }
        if (cmd === "TTL") return ttls.get(key) ?? -2;
        return null;
      });
      return new Response(JSON.stringify(out), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;
    return { getCalls: () => calls };
  }

  it("usa INCR+EXPIRE e devolve o TTL como retryAfter ao bloquear", async () => {
    setKvEnv(true);
    const mock = statefulMock();

    for (let i = 0; i < 5; i++) {
      assert.equal((await checkRateLimit("kv:key-1", "strict")).allowed, true);
    }
    const blocked = await checkRateLimit("kv:key-1", "strict");
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfter! >= 1 && blocked.retryAfter! <= 60);

    const lastCall = mock.getCalls().at(-1)!;
    assert.equal(lastCall[0][0], "TTL");
  });

  it("degrassa graciosamente para memória quando o KV falha", async () => {
    setKvEnv(true);
    globalThis.fetch = (async () => {
      throw new Error("network down");
    }) as typeof fetch;

    const r = await checkRateLimit("kv:fallback-1", "strict");
    assert.equal(r.allowed, true);
  });

  it("sem env configurado não usa KV (getKvClient devolve null)", async () => {
    setKvEnv(false);
    assert.equal((await checkRateLimit("kv:off-1", "strict")).allowed, true);
  });
});

describe("getClientIp", () => {
  it("usa x-real-ip", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "1.2.3.4" },
    });
    assert.equal(getClientIp(req), "1.2.3.4");
  });

  it("usa o último x-forwarded-for, nunca o primeiro (forjável)", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "9.9.9.9, 8.8.8.8" },
    });
    assert.equal(getClientIp(req), "8.8.8.8");
  });

  it("devolve 127.0.0.1 como fallback", () => {
    assert.equal(getClientIp(new Request("http://localhost")), "127.0.0.1");
  });
});

describe("rateLimitResponse", () => {
  it("devolve 429 com Retry-After e corpo em JSON", async () => {
    const res = rateLimitResponse(42);
    assert.equal(res.status, 429);
    assert.equal(res.headers.get("Retry-After"), "42");
    const body = (await res.json()) as { error: string };
    assert.match(body.error, /Demasiados/);
  });
});