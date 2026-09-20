"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface PageErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function PageError({ error, reset }: PageErrorProps) {
  useEffect(() => {
    // Regista o erro para diagnóstico — o utilizador vê apenas a mensagem amigável.
    console.error("Page error:", error);
  }, [error]);

  // Mostra detalhes apenas em desenvolvimento; em produção uma mensagem genérica.
  const detail = process.env.NODE_ENV === "development" ? error.message : undefined;

  return (
    <div
      role="alert"
      className="flex min-h-[50vh] items-center justify-center p-8"
    >
      <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: "rgba(239, 68, 68, 0.12)" }}>
          <AlertTriangle className="w-7 h-7 text-ib-danger" />
        </div>
        <h1 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Algo correu mal
        </h1>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          Ocorreu um erro inesperado ao carregar esta página.
          {detail ? ` (${detail})` : ""}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="glass-btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm rounded-xl"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}