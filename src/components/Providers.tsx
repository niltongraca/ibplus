"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ConfirmProvider } from "./ConfirmModal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
