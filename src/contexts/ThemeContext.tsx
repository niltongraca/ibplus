"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolvedTheme: "light",
  toggle: () => {},
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function systemPrefersDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Aplica o tema resolvido (ligado ao documento <html className="dark">).
  const apply = useCallback((t: "light" | "dark") => {
    setResolvedTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  // Segue mudanças do sistema quando o tema == "system".
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    apply(mq.matches ? "dark" : "light");
    const onChange = (e: MediaQueryListEvent) => apply(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, apply]);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("ibplus_theme") as Theme | null;
    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
      apply(stored);
    } else {
      setThemeState("system");
      // aplica via preferência do sistema (o effect acima cobre o restante)
      apply(systemPrefersDark() ? "dark" : "light");
    }
  }, [apply]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    if (t === "system") {
      localStorage.removeItem("ibplus_theme");
      apply(systemPrefersDark() ? "dark" : "light");
    } else {
      localStorage.setItem("ibplus_theme", t);
      apply(t);
    }
  }, [apply]);

  const toggle = useCallback(() => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  }, [resolvedTheme, setTheme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, toggle, setTheme }),
    [theme, resolvedTheme, toggle, setTheme]
  );

  // Evita flash de tema errado antes de montar (SSR).
  if (!mounted) {
    return <>{children}</>;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
