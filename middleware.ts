import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/api/auth/login", "/api/auth/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through without checking the session cookie.
  const isPublic = PUBLIC_PATHS.some(
    p => pathname === p || pathname.startsWith("/_next") || pathname.startsWith("/favicon")
  );
  if (isPublic) return NextResponse.next();

  // Check for session cookie presence (full validity is verified in each API/page handler).
  const sessionCookie = request.cookies.get("gat_session");
  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
