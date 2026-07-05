import type { WidgetId } from "./widgets";

export const DASHBOARD_LAYOUT: Record<string, WidgetId[]> = {
  EMPREENDEDOR: ["stats", "clients", "services", "finance"],

  EMPRESA: ["stats", "clients", "sales", "products", "services", "finance", "hr", "inventory", "campaigns"],

  ONG: ["stats", "clients", "donations", "campaigns", "finance"],

  ASSOCIACAO: ["stats", "clients", "finance"],

  EDUCACAO: ["stats", "students", "finance"],

  COOPERATIVA: ["stats", "clients", "finance", "inventory"],
};
