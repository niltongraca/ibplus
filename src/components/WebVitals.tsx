"use client";

import { useReportWebVitals } from "next/web-vitals";

/**
 * Reporta Core Web Vitals do browser para `/api/vitals` (beacon → tabela
 * WebVital). Componente cliente sem output visual; montado no root layout.
 * Auditoria #23 — CWV monitoring.
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    try {
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        path: window.location.pathname,
      });
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/vitals", new Blob([body], { type: "application/json" }));
      } else {
        fetch("/api/vitals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        });
      }
    } catch {
      // Não-crítico
    }
  });
  return null;
}