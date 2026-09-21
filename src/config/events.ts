/**
 * Constantes do módulo de Eventos & Bilhetes.
 * Client-safe (sem dependências de Node), partilhado por páginas e validações.
 */

export const EVENT_CATEGORIES = [
  "concerto",
  "conferencia",
  "workshop",
  "desporto",
  "cultural",
  "religioso",
  "outro",
] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  concerto: "Concerto",
  conferencia: "Conferência",
  workshop: "Workshop/Formação",
  desporto: "Desporto",
  cultural: "Cultural",
  religioso: "Religioso",
  outro: "Outro",
};

export const EVENT_STATUSES = [
  "RASCUNHO",
  "PUBLICADO",
  "ESGOTADO",
  "CANCELADO",
  "TERMINADO",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  RASCUNHO: "Rascunho",
  PUBLICADO: "Publicado",
  ESGOTADO: "Esgotado",
  CANCELADO: "Cancelado",
  TERMINADO: "Terminado",
};

export const EVENT_STATUS_STYLES: Record<EventStatus, string> = {
  RASCUNHO: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  PUBLICADO: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  ESGOTADO: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  CANCELADO: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  TERMINADO: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

export const TICKET_KINDS = ["CONVITE", "INGRESSO", "BILHETE"] as const;
export type TicketKind = (typeof TICKET_KINDS)[number];

export const TICKET_KIND_LABELS: Record<TicketKind, string> = {
  CONVITE: "Convite",
  INGRESSO: "Ingresso",
  BILHETE: "Bilhete de entrada",
};

export const TICKET_STATUSES = ["VALIDO", "USADO", "CANCELADO"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  VALIDO: "Válido",
  USADO: "Usado",
  CANCELADO: "Cancelado",
};

export const TICKET_STATUS_STYLES: Record<TicketStatus, string> = {
  VALIDO: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  USADO: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  CANCELADO: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};
