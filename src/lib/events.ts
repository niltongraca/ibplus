import { randomBytes } from "crypto";

// Códigos sem caracteres ambíguos (0/O, 1/I) para facilitar leitura/digitação.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Gera um código de bilhete legível e praticamente único: `IB-XXXXX-XXXXX`. */
export function generateTicketCode(prefix = "IB"): string {
  const bytes = randomBytes(10);
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `${prefix}-${out.slice(0, 5)}-${out.slice(5, 10)}`;
}

/**
 * Converte uma data/hora local da empresa (ex.: valor de `<input datetime-local>`
 * ou "2026-12-01T18:30") no instante UTC correspondente, respeitando o fuso.
 * Sem isto, `new Date("2026-12-01T18:30")` seria interpretado no fuso do servidor
 * (UTC na Vercel), desviando a hora em face da hora pretendida pelo utilizador.
 */
export function parseEventDateTime(
  value: string | null | undefined,
  tz = process.env.COMPANY_TIMEZONE || "Africa/Luanda"
): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(value.trim());
  if (!m) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const [, y, mo, d, hh = "00", mm = "00"] = m;
  const utcGuess = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(hh), Number(mm));
  const offset = tzOffsetMs(utcGuess, tz);
  const result = new Date(utcGuess - offset);
  return Number.isNaN(result.getTime()) ? null : result;
}

/** Diferença (ms) entre a hora local no fuso e a UTC, no instante dado. */
function tzOffsetMs(utcMs: number, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const get = (type: string) => {
    const p = parts.find((x) => x.type === type);
    return p ? Number(p.value) : 0;
  };
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  );
  return asUtc - utcMs;
}

/** Formata uma data no fuso da empresa (por omissão Africa/Luanda). */
export function formatEventDate(
  value: Date | string | null | undefined,
  tz = process.env.COMPANY_TIMEZONE || "Africa/Luanda",
  withTime = true
): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-AO", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" } : {}),
  }).format(date);
}
