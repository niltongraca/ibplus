import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ROUTE_PERMISSIONS, PUBLIC_ROUTES } from "@/config/rbacRoutes";
import { CARGO_LEVELS, DEFAULT_FEATURE_PERMISSIONS, ROUTE_FEATURE_MAP, type CargoLevel } from "@/config/permissions";
import { CSRF_COOKIE, CSRF_HEADER, csrfCookieOptions, evaluateCsrf, generateCsrfToken } from "@/lib/csrf";
import { getJwtSecret } from "@/lib/secrets";

// Endpoints /api/* intencionalmente SEM sessão JWT: auth de baixo nível
// (login/register/forgot/reset), informação pública (content/plans/praca/contact/
// invite-info) e rotas a secret próprio (cron com CRON_SECRET, verificado no handler).
// Tudo o resto em /api/* exige JWT válido — fail-closed (nenhum handler pode
// "esquecer-se" de chamar getAuthUser e ficar público por omissão).
const API_PUBLIC_PREFIXES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/company/invite/info",
  "/api/contact",
  "/api/content",
  "/api/plans",
  "/api/praca",
  "/api/cron",
];

function isApiPublic(pathname: string): boolean {
  return API_PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

async function verifyTokenEdge(token: string): Promise<Record<string, any> | null> {
  try {
    // getJwtSecret() (secrets.ts) falha-rápido se faltar JWT_SECRET — o catch
    // converte isso em "não autenticado" (fail-closed, sem segredo vazio).
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as Record<string, any>;
  } catch {
    return null;
  }
}

function matchRoute(pathname: string, routes: Record<string, string[]>): string | null {
  for (const prefix of Object.keys(routes)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return prefix;
  }
  return null;
}

function matchFeatureRoute(pathname: string, routes: Record<string, string>): string | null {
  for (const prefix of Object.keys(routes)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return prefix;
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // CSRF double-submit: garante que o cookie ibplus_csrf existe em qualquer
  // resposta (páginas e APIs). O valor é lido pelo JS (httpOnly:false) e
  // enviado como header nas mutações — validado mais abaixo para /api/*.
  if (!request.cookies.get(CSRF_COOKIE)?.value) {
    response.cookies.set(CSRF_COOKIE, generateCsrfToken(), csrfCookieOptions());
  }

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    return response;
  }

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return response;
  }

  // Gate /api/* fail-closed: fora da allowlist pública, JWT válido é obrigatório.
  // Um handler que "esqueça" getAuthUser() já não fica público por omissão —
  // o middleware responde 401 JSON antes de chegar à rota.
  if (pathname.startsWith("/api")) {
    if (!isApiPublic(pathname)) {
      const token = request.cookies.get("ibplus_session")?.value;
      const payload = token ? await verifyTokenEdge(token) : null;
      if (!payload) {
        const unauthorized = NextResponse.json(
          { error: "Não autenticado." },
          { status: 401 }
        );
        addSecurityHeaders(unauthorized);
        return unauthorized;
      }

      // CSRF double-submit em mutações: o header x-csrf-token tem de igualar
      // o cookie semeado acima. Sessões legadas sem cookie de CSRF passam uma
      // vez (o cookie é semeado na resposta) — a partir daí o gate é estrito.
      const method = request.method.toUpperCase();
      if (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") {
        const csrfCookie = request.cookies.get(CSRF_COOKIE)?.value;
        const csrfHeader = request.headers.get(CSRF_HEADER);
        const decision = evaluateCsrf(csrfCookie, csrfHeader);
        if (decision === "seed") {
          response.cookies.set(CSRF_COOKIE, generateCsrfToken(), csrfCookieOptions());
        } else if (decision === "reject") {
          const forbidden = NextResponse.json(
            { error: "Sessão inválida (CSRF)." },
            { status: 403 }
          );
          forbidden.cookies.delete(CSRF_COOKIE);
          addSecurityHeaders(forbidden);
          return forbidden;
        }
      }
    }
    return response;
  }

  const token = request.cookies.get("ibplus_session")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const redirectRes = NextResponse.redirect(loginUrl);
    addSecurityHeaders(redirectRes);
    return redirectRes;
  }

  const payload = await verifyTokenEdge(token);
  if (!payload) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("ibplus_session");
    addSecurityHeaders(res);
    return res;
  }

  const accountType = payload.accountType as string;
  const role = payload.role as string | undefined;

  const matchedRoute = matchRoute(pathname, ROUTE_PERMISSIONS);

  if (matchedRoute) {
    const allowedTypes = ROUTE_PERMISSIONS[matchedRoute];

    if (allowedTypes.includes("admin") && role !== "admin") {
      const res = NextResponse.redirect(new URL("/login", request.url));
      addSecurityHeaders(res);
      return res;
    }

    if (!allowedTypes.includes(accountType) && !allowedTypes.includes("admin")) {
      const res = NextResponse.redirect(new URL("/gestao/dashboard", request.url));
      addSecurityHeaders(res);
      return res;
    }
  }

  // Printeria por nível de cargo (matriz default; edge sem acesso à BD).
  // Contas sem cargo (ex.: antigas) ou sem empresa não são restringidas;
  // as restrições dinâmicas por empresa são aplicadas nas APIs/servidor.
  if (role !== "admin" && payload.companyId) {
    const cargoLevel = payload.cargoLevel as CargoLevel | undefined;
    const featurePrefix = matchFeatureRoute(pathname, ROUTE_FEATURE_MAP);
    if (featurePrefix) {
      const feature = ROUTE_FEATURE_MAP[featurePrefix];
      const level = cargoLevel && CARGO_LEVELS.includes(cargoLevel) ? cargoLevel : null;
      if (level && DEFAULT_FEATURE_PERMISSIONS[level][feature] === false) {
        const res = NextResponse.redirect(new URL("/gestao/dashboard", request.url));
        addSecurityHeaders(res);
        return res;
      }
    }
  }

  return response;
}

function addSecurityHeaders(res: NextResponse) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
