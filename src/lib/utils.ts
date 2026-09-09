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
