import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseAdmin } from "./supabaseAdmin";

export type AdminUser = {
  id: string;
  email: string | null;
  fullName: string;
  avatarUrl: string | null;
  role: "admin" | "customer";
};

const ROLE_CACHE_TTL_MS = 30_000;
const roleCache = new Map<string, { role: string; expires: number }>();

async function getProfileRole(userId: string): Promise<"admin" | "customer"> {
  const cached = roleCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return cached.role === "admin" ? "admin" : "customer";
  }
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[adminGuard] role lookup failed", error.message);
    return "customer";
  }
  const role = (data?.role as string | undefined) ?? "customer";
  roleCache.set(userId, { role, expires: Date.now() + ROLE_CACHE_TTL_MS });
  return role === "admin" ? "admin" : "customer";
}

export function invalidateRoleCache(userId?: string) {
  if (userId) {
    roleCache.delete(userId);
    return;
  }
  roleCache.clear();
}

export type GetAdminContextOptions = {
  allowCustomer?: boolean;
};

export async function getAdminContext(
  options: GetAdminContextOptions = {}
): Promise<AdminUser | null> {
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
            // Server Component cannot set cookies; route handlers can.
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const role = await getProfileRole(user.id);
  if (role !== "admin" && !options.allowCustomer) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, profile_image_url")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: (profile?.full_name as string | undefined) ?? user.email ?? "Admin",
    avatarUrl: (profile?.profile_image_url as string | null) ?? null,
    role,
  };
}

export async function requireAdmin(): Promise<AdminUser> {
  const ctx = await getAdminContext();
  if (!ctx) {
    redirect("/admin/login?error=Anda+harus+login+sebagai+admin");
  }
  return ctx;
}

export async function requireAdminApi(): Promise<AdminUser | Response> {
  const ctx = await getAdminContext();
  if (!ctx) {
    return new Response(
      JSON.stringify({ error: "Akses admin tidak valid." }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
  }
  return ctx;
}

export function isResponse(value: unknown): value is Response {
  return value instanceof Response;
}
