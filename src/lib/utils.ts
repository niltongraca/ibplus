export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(value: number, currency: string = "AOA"): string {
  const code = SUPPORTED_CURRENCIES.includes(currency) ? currency : "AOA";
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(value);
}

export const SUPPORTED_CURRENCIES = ["AOA", "USD", "EUR", "BRL", "ZAR", "CNY"];

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-AO").format(new Date(date));
}

/** Data + hora no fuso da empresa (por omissão Africa/Luanda). */
export function formatDateTime(date: Date | string, tz = "Africa/Luanda"): string {
  return new Intl.DateTimeFormat("pt-AO", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

/**
 * Converte um valor date-only ("YYYY-MM-DD" de <input type="date">) no meio-dia local.
 * Evita o desvio de dia: `new Date("YYYY-MM-DD")` interpreta meia-noite UTC, o que no
 * fuso -x desloca para o dia anterior na exibição. O meio-dia local garante o mesmo
 * dia do calendário em qualquer fuso e evita bugs de DST.
 */
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parsePagination(searchParams: URLSearchParams, defaultLimit = 20, maxLimit = 100): { page: number; limit: number; skip: number } {
  const page = Number.parseInt(searchParams.get("page") || "1", 10);
  const limit = Number.parseInt(searchParams.get("limit") || String(defaultLimit), 10);
  const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(1, limit), maxLimit) : defaultLimit;
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

/**
 * Constrói um filtro Prisma `OR` de pesquisa (contains, case-insensitive) sobre
 * os campos indicados. Cada campo pode ser "nome" ou [relação, campo] para
 * pesquisar em relações (ex.: ["customer", "name"]).
 */
export function buildSearch(fields: Array<string | [string, string]>, value?: string | null) {
  const v = (value ?? "").trim();
  if (!v) return undefined;
  return {
    OR: fields.map((f) => {
      if (typeof f === "string") return { [f]: { contains: v, mode: "insensitive" as const } };
      const [rel, field] = f;
      return { [rel]: { [field]: { contains: v, mode: "insensitive" as const } } };
    }),
  };
}

/** Converte "true"/"1"/"false"/"0" em boolean (ou undefined se ausente). */
export function parseBool(value?: string | null): boolean | undefined {
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return undefined;
}

/**
 * Devolve o instante UTC de meia-noite do dia corrente no fuso da empresa.
 * Previne o bug de "hoje": `new Date().setHours(0,0,0,0)` usa o fuso do servidor
 * (UTC na Vercel) e às 00:30 locais (ex.: Angola UTC+1) venda conta como "ontem".
 * Usa `Intl` para obter a data calendário no fuso e devolve `Date.UTC(y,m,d)`.
 */
export function startOfTodayUtc(tz = process.env.COMPANY_TIMEZONE || "Africa/Luanda"): Date {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dtf.formatToParts(new Date());
  let year = "", month = "", day = "";
  for (const p of parts) {
    if (p.type === "year") year = p.value;
    else if (p.type === "month") month = p.value;
    else if (p.type === "day") day = p.value;
  }
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0));
}
