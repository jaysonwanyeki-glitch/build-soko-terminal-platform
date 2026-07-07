import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "soko_session";

// Pages that REQUIRE authentication (wallet, personal data, trading desk)
const PROTECTED_PATHS = ["/portfolio", "/watchlist", "/alerts", "/orders", "/settings"];

// Pages that are always public (auth, marketing, assets)
const PUBLIC_PREFIXES = [
  "/login", "/register", "/about", "/learn",
  "/forgot-password", "/auth/",
  "/api/", "/_next/", "/images/", "/icon", "/favicon",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public assets & auth pages
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Only protect wallet / personal pages — market data stays public for browsing
  const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
