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
