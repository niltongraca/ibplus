// Cliente REST mínimo para Upstash / Vercel KV (compatível com o protocolo
// REST do Upstash, que a Vercel KV também usa). Sem dependências — apenas
// fetch — para não depender de instalação de pacotes.
//
// Env usadas (como a Vercel preenche no Marketplace):
//   KV_REST_API_URL / KV_REST_API_TOKEN     (Vercel KV)
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN  (Upstash)
// Sem nenhuma das variáveis, getKvClient() devolve null e o rate limiter
// continua a funcionar com o Map em memória (dev/local/fallback).

export interface KvClient {
  /**
   * Executa comandos Redis em pipeline. `commands` é uma lista de comandos
   * estilo `["INCR", "key"]`. Devolve os resultados na mesma ordem.
   */
  pipeline(commands: string[][]): Promise<unknown[]>;
}

class UpstashRestClient implements KvClient {
  constructor(
    private readonly url: string,
    private readonly token: string
  ) {}

  async pipeline(commands: string[][]): Promise<unknown[]> {
    const res = await fetch(`${this.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`KV: resposta ${res.status}`);
    }
    const data: unknown = await res.json();
    if (!Array.isArray(data)) {
      throw new Error("KV: resposta inesperada");
    }
    return data;
  }
}

let cachedKv: KvClient | null | undefined;

export function getKvClient(): KvClient | null {
  if (cachedKv !== undefined) return cachedKv;
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
  cachedKv = url && token ? new UpstashRestClient(url, token) : null;
  return cachedKv;
}

/** Limpa a cache do cliente (usado nos testes para alternar env). */
export function resetKvClientCache(): void {
  cachedKv = undefined;
}