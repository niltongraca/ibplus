"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

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

const STORAGE_KEY = "ibplus_theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";
type ResolvedTheme = "light" | "dark";

function readStoredTheme(): Theme | null {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" ? value : null;
}

function subscribeStoredTheme(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getStoredTheme(): Theme | null {
  return readStoredTheme();
}

// No servidor ainda não existe localStorage: `undefined` distingue "não hidratado".
function getServerStoredTheme(): undefined {
  return undefined;
}

function subscribeSystemTheme(onChange: () => void) {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function getServerSystemTheme(): ResolvedTheme {
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<Theme | null>(null);
  const stored = useSyncExternalStore<Theme | null | undefined>(
    subscribeStoredTheme,
    getStoredTheme,
    getServerStoredTheme
  );
  const systemTheme = useSyncExternalStore<ResolvedTheme>(
    subscribeSystemTheme,
    getSystemTheme,
    getServerSystemTheme
  );

  const hydrated = stored !== undefined;
  const theme: Theme = override ?? stored ?? "system";
  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  // O efeito apenas sincroniza um sistema externo (a classe do <html>), sem setState.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  const setTheme = useCallback((t: Theme) => {
    setOverride(t);
    if (t === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, t);
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  }, [resolvedTheme, setTheme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, toggle, setTheme }),
    [theme, resolvedTheme, toggle, setTheme]
  );

  // Evita flash de tema errado antes de hidratar (SSR).
  if (!hydrated) {
    return <>{children}</>;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
