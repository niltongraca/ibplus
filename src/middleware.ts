import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTE_PERMISSIONS, PUBLIC_ROUTES } from "@/config/rbacRoutes";

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
