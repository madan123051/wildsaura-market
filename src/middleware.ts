import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Protected Routes (require auth cookie) ─────────────
const protectedPrefixes = ["/dashboard", "/downloads", "/admin", "/profile", "/upload"];

// ─── Auth Routes (redirect to dashboard if already logged in) ──
const authPrefixes = ["/login", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("wildsaura_session")?.value;

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  const isAuthRoute = authPrefixes.some((p) => pathname.startsWith(p));

  // Not logged in → redirect to login with return URL
  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in → skip auth pages
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/downloads/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/upload/:path*",
    "/login",
    "/forgot-password",
  ],
};
