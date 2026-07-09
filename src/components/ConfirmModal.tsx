"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({
  confirm: () => Promise.resolve(false),
});

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  const variantStyles = {
    danger: {
      icon: "text-red-500 bg-red-100",
      button: "bg-red-600 hover:bg-red-700 focus:ring-red-400",
    },
    warning: {
      icon: "text-yellow-500 bg-yellow-100",
      button: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-400",
    },
    info: {
      icon: "text-blue-500 bg-blue-100",
      button: "bg-ib-accent hover:bg-blue-700 focus:ring-ib-accent/40",
    },
  };

  const styles = variantStyles[state?.options.variant || "danger"];

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={handleCancel} />
          <div className="relative z-10 bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in-95">
            <button
              onClick={handleCancel}
              className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4 text-ib-muted" />
            </button>
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full shrink-0 ${styles.icon}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-ib-primary">
                  {state.options.title}
                </h3>
                <p className="text-sm text-ib-muted mt-1">
                  {state.options.message}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-ib-muted hover:text-ib-primary font-medium rounded-lg hover:bg-gray-50"
              >
                {state.options.cancelLabel || "Cancelar"}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm text-white font-medium rounded-lg focus:outline-none focus:ring-2 ${styles.button}`}
              >
                {state.options.confirmLabel || "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
