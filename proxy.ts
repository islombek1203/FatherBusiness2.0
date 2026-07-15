import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

// This is a UX-level gate only (redirect to /login, keep admins out of admin
// routes at the URL level). It is not the source of truth for authorization:
// every server action / route handler re-checks the session and role
// independently, per the "never trust the client" requirement.
const PUBLIC_PATHS = ["/login", "/offline"];
const ADMIN_ONLY_PREFIXES = ["/admin", "/settings", "/users"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes enforce their own auth (and should return JSON 401s, not HTML
  // redirects); the NextAuth routes must always be reachable to sign in/out.
  if (pathname.startsWith("/api") || PUBLIC_PATHS.some((path) => pathname === path)) {
    return NextResponse.next();
  }

  const session = await auth();

  if (!session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix)) &&
    session.user.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip static assets, images, PWA files, and Next internals; run on
    // everything else. sw.js in particular must stay public: the service
    // worker is registered from every page, including /login.
    "/((?!_next/static|_next/image|favicon.ico|icon.png|manifest.json|sw\\.js|icons/).*)",
  ],
};
