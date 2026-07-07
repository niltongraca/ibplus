import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTE_PERMISSIONS, PUBLIC_ROUTES } from "@/config/rbacRoutes";

const RESOURCE_ROUTES: [string, string][] = [
  ["/gestao/dashboard", "dashboard"],
  ["/gestao/produtos", "produtos"],
  ["/gestao/servicos", "servicos"],
  ["/gestao/clientes", "clientes"],
  ["/gestao/vendas", "vendas"],
  ["/gestao/compras", "compras"],
  ["/gestao/despesas", "despesas"],
  ["/gestao/fluxo-caixa", "fluxo-caixa"],
  ["/gestao/stock", "stock"],
  ["/finance/faturacao", "faturacao"],
  ["/finance/orcamentos", "orcamentos"],
  ["/finance/cobrancas", "cobrancas"],
  ["/finance/contas-pagar", "contas-pagar"],
  ["/finance/contas-receber", "contas-receber"],
  ["/finance/relatorios", "relatorios"],
  ["/rh", "rh"],
  ["/marketing", "marketing"],
  ["/crm", "crm"],
  ["/ia", "ia"],
  ["/store", "store"],
  ["/praca", "praca"],
];

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

function matchRoute(pathname: string, routes: Record<string, string[]>): string | null {
  for (const prefix of Object.keys(routes)) {
    if (pathname.startsWith(prefix)) return prefix;
  }
  return null;
}

function matchResourceKey(pathname: string): string | null {
  for (const [prefix, key] of RESOURCE_ROUTES) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return key;
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

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    return response;
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname === "/favicon.ico") {
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

  const payload = decodeJwtPayload(token);
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

  if (role !== "admin") {
    const resourceKey = matchResourceKey(pathname);
    if (resourceKey) {
      try {
        const apiUrl = new URL("/api/resources/user", request.url);
        const response = await fetch(apiUrl.toString(), {
          headers: { Cookie: request.headers.get("cookie") || "" },
        });
        if (response.ok) {
          const data = await response.json();
          const allowedKeys: string[] = data.allowedKeys ?? [];
          if (!allowedKeys.includes(resourceKey)) {
            return NextResponse.redirect(new URL("/unauthorized", request.url));
          }
        }
      } catch {
        // If fetch fails, allow through
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
