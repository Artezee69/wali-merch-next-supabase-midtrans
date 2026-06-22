import { NextResponse, type NextRequest } from "next/server";

// Edge-level admin gate.
//
// Runs BEFORE any /admin or /api/admin page/handler renders, so anonymous
// visitors never receive admin HTML even if a page forgets to call
// requireAdmin() server-side.
//
// We deliberately do NOT call supabase.auth.getUser() here. On the Edge
// runtime, getUser() can race the Set-Cookie from the Node login route and
// return null even when the user is authenticated, causing a redirect loop
// back to /admin/login. Instead we just look for a Supabase auth cookie —
// the authoritative role check is still done per-page by requireAdmin()
// (lib/adminGuard.ts) and per-API by getAdminContext(), which run in the
// Node runtime with full server context.
//
// Exempt paths (must be reachable without a session — they ARE the
// entry/exit points of the auth flow):
//   - /admin/login
//   - /api/admin/login
//   - /api/admin/logout
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPath =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/api/admin" ||
    pathname.startsWith("/api/admin/");

  if (!isAdminPath) {
    return NextResponse.next({ request });
  }

  const isAuthExempt =
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout";

  if (isAuthExempt) {
    return NextResponse.next({ request });
  }

  const hasSupabaseAuthCookie = request.cookies
    .getAll()
    .some((c) => {
      // Supabase SSR cookies are named after the project ref, e.g.
      //   `<project-ref>-auth-token`
      //   `<project-ref>-auth-token-code-verifier`
      // Chunked tokens may be split into `.0`, `.1`, ... pieces.
      // Older projects used the `sb-` prefix. Accept all variants.
      const name = c.name;
      const isProjectAuthToken =
        /(^|-)auth-token(\.|$)/.test(name) ||
        /(^|-)auth-token-code-verifier$/.test(name);
      const hasSbPrefix = name.startsWith("sb-");
      return isProjectAuthToken || hasSbPrefix;
    });

  if (!hasSupabaseAuthCookie) {
    // TEMP DEBUG: surface cookie names so we can confirm the cookie name
    // pattern matches what Supabase is actually writing. Remove after fix.
    const cookieNames = request.cookies.getAll().map((c) => c.name);
    console.log("[proxy] admin path without auth cookie", {
      pathname,
      cookieNames,
    });
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "?error=Anda+harus+login+sebagai+admin";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
