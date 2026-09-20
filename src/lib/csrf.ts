// CSRF double-submit: cookie legível por JS + header x-csrf-token igual.
// O cookie é semeado no middleware (qualquer resposta) e revalidado em
// mutações /api/* não-públicas. Partilhado entre middleware (edge), rotas e client.

export const CSRF_COOKIE = "ibplus_csrf";
export const CSRF_HEADER = "x-csrf-token";

// Alinhado com a expiração do JWT (7 dias).
export const CSRF_MAX_AGE = 60 * 60 * 24 * 7;

export function generateCsrfToken(): string {
  return crypto.randomUUID();
}

export function csrfCookieOptions() {
  return {
    // httpOnly:false é intencional — o JS do cliente lê o valor e envia-o como header.
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: CSRF_MAX_AGE,
  };
}

export type CsrfDecision = "ok" | "seed" | "reject";

// Regra do double-submit (função pura, testável):
//  - sem cookie (sessão legada/primeira visita) → "seed" (semeia e deixa passar);
//  - cookie existe e header é igual → "ok";
//  - cookie existe e header falta/não confere → "reject" (403).
export function evaluateCsrf(
  cookie: string | undefined,
  header: string | null | undefined
): CsrfDecision {
  if (!cookie) return "seed";
  return header && header === cookie ? "ok" : "reject";
}