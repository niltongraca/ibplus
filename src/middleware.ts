import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTE_PERMISSIONS, PLAN_ROUTES, PUBLIC_ROUTES } from "@/config/rbacRoutes";

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const token = request.cookies.get("ibplus_session")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("ibplus_session");
    return res;
  }

  const accountType = payload.accountType as string;
  const plan = payload.plan as string | undefined;
  const role = payload.role as string | undefined;

  const matchedRoute = matchRoute(pathname, ROUTE_PERMISSIONS);

  if (matchedRoute) {
    const allowedTypes = ROUTE_PERMISSIONS[matchedRoute];

    if (allowedTypes.includes("admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!allowedTypes.includes(accountType) && !allowedTypes.includes("admin")) {
      return NextResponse.redirect(new URL("/gestao/dashboard", request.url));
    }
  }

  const matchedPlanRoute = matchRoute(pathname, PLAN_ROUTES);
  if (matchedPlanRoute && plan) {
    const allowedPlans = PLAN_ROUTES[matchedPlanRoute];
    if (!allowedPlans.includes(plan)) {
      return NextResponse.redirect(new URL("/upgrade", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
