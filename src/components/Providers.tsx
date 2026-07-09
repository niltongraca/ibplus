"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ConfirmProvider } from "./ConfirmModal";
import { ToastProvider } from "./Toast";

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
