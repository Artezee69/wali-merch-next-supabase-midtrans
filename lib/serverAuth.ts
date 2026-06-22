import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseAdmin } from "./supabaseAdmin";

export type CurrentUser = {
  id: string;
  email: string | null;
  fullName: string;
  avatarUrl: string | null;
  role: "admin" | "customer";
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
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

  let user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    // Vercel cold-start fallback: getUser() can race the Set-Cookie from
    // the login response. Re-read cookies and try getSession() which
    // validates the JWT locally.
    const hasAuthCookie = cookieStore
      .getAll()
      .some(
        (c) =>
          /(^|-)auth-token(\.|$)/.test(c.name) ||
          /(^|-)auth-token-code-verifier$/.test(c.name) ||
          c.name.startsWith("sb-")
      );
    if (hasAuthCookie) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) user = sessionData.session.user;
    }
  }
  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, profile_image_url, role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    fullName:
      (profile?.full_name as string | undefined) ??
      user.user_metadata?.full_name ??
      user.email ??
      "Pengguna",
    avatarUrl: (profile?.profile_image_url as string | null) ?? null,
    role:
      (profile?.role as "admin" | "customer" | undefined) === "admin"
        ? "admin"
        : "customer",
  };
}
