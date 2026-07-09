import type { WidgetId } from "./widgets";

export const DASHBOARD_LAYOUT: Record<string, WidgetId[]> = {
  EMPREENDEDOR: ["stats", "clients", "services", "sales", "finance"],

  EMPRESA: ["stats", "clients", "sales", "products", "services", "finance", "hr", "inventory"],

  ONG: ["stats", "clients", "donations", "campaigns", "finance"],

  ASSOCIACAO: ["stats", "clients", "finance"],

  EDUCACAO: ["stats", "students", "finance"],

  COOPERATIVA: ["stats", "clients", "products", "inventory", "finance"],
};
