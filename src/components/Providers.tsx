"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ConfirmProvider } from "./ConfirmModal";
import { ToastProvider } from "./Toast";
// Patch global do fetch para enviar o header CSRF em mutações /api/* (módulo
// com side-effect idempotente; no-op em SSR).
import "@/lib/csrfClient";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConfirmProvider>
          <ToastProvider>{children}</ToastProvider>
        </ConfirmProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
