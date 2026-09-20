"use client";

// Patch global de window.fetch para enviar o header CSRF double-submit em
// mutações same-origin para /api/*. Cobre todos os fetch("directo") e o
// apiFetch() num único ponto — código novo não precisa de se lembrar do header.
import { CSRF_COOKIE, CSRF_HEADER } from "./csrf";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

let patched = false;

export function readCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  for (const part of document.cookie.split("; ")) {
    const idx = part.indexOf("=");
    if (idx > -1 && part.slice(0, idx) === CSRF_COOKIE) {
      return decodeURIComponent(part.slice(idx + 1));
    }
  }
  return null;
}

function shouldAttachToken(input: RequestInfo | URL, init?: RequestInit): boolean {
  const method = (
    init?.method ??
    (input instanceof Request ? input.method : undefined) ??
    "GET"
  ).toUpperCase();
  if (!MUTATING_METHODS.has(method)) return false;

  let url: URL | null = null;
  try {
    if (typeof input === "string") url = new URL(input, window.location.origin);
    else if (input instanceof URL) url = new URL(input.href);
    else if (input instanceof Request) url = new URL(input.url);
  } catch {
    return false;
  }
  if (!url) return false;
  if (url.origin !== window.location.origin) return false;
  return url.pathname.startsWith("/api");
}

export function initializeCsrfPatch(): void {
  if (patched || typeof window === "undefined") return;
  patched = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (shouldAttachToken(input, init)) {
      const token = readCsrfToken();
      if (token) {
        const headers = new Headers(init?.headers);
        if (!headers.has(CSRF_HEADER)) {
          headers.set(CSRF_HEADER, token);
        }
        init = { ...init, headers };
      }
    }
    return originalFetch(input, init);
  };
}

// Semeia o patch assim que o bundle do cliente carrega (antes de qualquer
// interação; idempotente). Em SSR (window indefinido) é um no-op.
if (typeof window !== "undefined") {
  initializeCsrfPatch();
}