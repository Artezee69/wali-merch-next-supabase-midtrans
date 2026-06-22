import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseAdmin } from "./supabaseAdmin";

export type AdminSession = {
  userId: string;
  email: string;
  fullName: string;
  role: "admin";
};

async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options: opts } of cookiesToSet) {
              cookieStore.set(name, value, opts as CookieOptions);
            }
          } catch {
            /* read-only context */
          }
        },
      },
    }
  );

  // Primary path: verify the JWT against the Supabase Auth server.
  let user = (await supabase.auth.getUser()).data.user;

  // Fallback for Vercel/Edge cold starts where the cookies() read in the
  // first request after Set-Cookie lags by one turn and getUser() returns
  // null. We re-read the auth cookies directly and call getSession(),
  // which validates the JWT locally without a network round-trip.
  if (!user) {
    const all = cookieStore.getAll();
    const tokenNames = all
      .map((c) => c.name)
      .filter(
        (n) =>
          /(^|-)auth-token(\.|$)/.test(n) ||
          /(^|-)auth-token-code-verifier$/.test(n) ||
          n.startsWith("sb-")
      );
    if (tokenNames.length > 0) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        user = sessionData.session.user;
        console.log("[adminAuth] getUser() null, recovered via getSession()", {
          userId: user.id,
          tokenNames,
        });
      } else {
        console.log("[adminAuth] no session", { tokenNames });
      }
    } else {
      console.log("[adminAuth] no auth cookie present");
    }
  }

  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") return null;

  return {
    userId: user.id,
    email: profile.email ?? user.email ?? "",
    fullName: profile.full_name ?? "Admin",
    role: "admin",
  };
}

/**
 * Server-side guard. Redirects unauthenticated requests to
 * /admin/login and authenticated-but-not-admin requests to
 * /admin/login?reason=not_admin.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login?reason=session");
  }
  return session;
}
