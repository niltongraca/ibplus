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

export function parsePagination(searchParams: URLSearchParams, defaultLimit = 20, maxLimit = 100): { page: number; limit: number; skip: number } {
  const page = Number.parseInt(searchParams.get("page") || "1", 10);
  const limit = Number.parseInt(searchParams.get("limit") || String(defaultLimit), 10);
  const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(1, limit), maxLimit) : defaultLimit;
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}
