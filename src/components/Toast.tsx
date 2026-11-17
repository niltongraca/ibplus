"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";
import { PLAN_LIMIT_EVENT, type PlanLimitEventDetail } from "@/lib/api";

type ToastType = "success" | "error" | "info";

interface ToastAction {
  label: string;
  href: string;
}

interface ToastOptions {
  action?: ToastAction;
  duration?: number;
}

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  action?: ToastAction;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: AlertCircle,
};

const colors = {
  success: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
  error: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
  info: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "success", options?: ToastOptions) => {
    const id = ++nextId.current;
    setToasts((prev) => [...prev, { id, type, message, action: options?.action }]);
    setTimeout(() => dismiss(id), options?.duration ?? 4000);
  }, [dismiss]);

  // Quando o servidor devolve PLAN_LIMIT_REACHED, o apiFetch emite este evento.
  // O aviso aparece em qualquer página, com link directo para os planos.
  useEffect(() => {
    function onPlanLimit(event: Event) {
      const detail = (event as CustomEvent<PlanLimitEventDetail>).detail;
      toast(detail?.message || "O limite do seu plano foi atingido.", "error", {
        action: { label: "Ver planos", href: "/upgrade" },
        duration: 10000,
      });
    }
    window.addEventListener(PLAN_LIMIT_EVENT, onPlanLimit);
    return () => window.removeEventListener(PLAN_LIMIT_EVENT, onPlanLimit);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm" role="status" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              className={`px-4 py-3 rounded-lg border shadow-lg animate-in slide-in-from-right ${colors[t.type]}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm flex-1">{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Fechar notificação"
                  className="shrink-0 hover:opacity-70 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {t.action && (
                <Link
                  href={t.action.href}
                  onClick={() => dismiss(t.id)}
                  className="mt-2 ml-8 inline-flex text-sm font-semibold underline underline-offset-2 hover:opacity-80"
                >
                  {t.action.label} →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
