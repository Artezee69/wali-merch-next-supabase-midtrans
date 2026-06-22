import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "@/lib/validate";
import { rateLimit, rateLimitReset, getClientIp } from "@/lib/rateLimit";
import { logAdminAction } from "@/lib/adminAudit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LoginSchema = z.object({
  email: z.string().min(1).max(254).email(),
  password: z.string().min(1).max(200),
});

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_SEC = 5 * 60;

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const rl = rateLimit(`admin-login:${ip}`, {
    limit: LOGIN_LIMIT,
    windowSec: LOGIN_WINDOW_SEC,
  });
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: `Terlalu banyak percobaan. Coba lagi dalam ${rl.resetInSec} detik.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.resetInSec),
        },
      }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  let body: unknown;
  if (contentType.includes("application/json")) {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Payload tidak valid." },
        { status: 400 }
      );
    }
  } else {
    const formData = await request.formData();
    body = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Input tidak valid." },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  // Collect cookies the Supabase SSR client wants to write so we can
  // attach them to the outgoing response regardless of whether the
  // cookies() write succeeded (Edge runtime, server actions, etc).
  // We strip out any `domain` from the options Supabase hands us —
  // binding to a specific host here is the most common cause of
  // "cookie set but browser never sends it" in Vercel deployments,
  // because the production domain and the preview domain differ.
  const pendingCookies: { name: string; value: string; options?: CookieOptions }[] = [];
  const sanitize = (options?: CookieOptions): CookieOptions | undefined => {
    if (!options) return undefined;
    const { domain: _domain, ...rest } = options as CookieOptions & { domain?: string };
    return rest as CookieOptions;
  };
  const applyCookie = (name: string, value: string, options?: CookieOptions) => {
    pendingCookies.push({ name, value, options: sanitize(options) });
  };

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
          for (const { name, value, options } of cookiesToSet) {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // fall through — pendingCookies will carry it to the response
            }
            applyCookie(name, value, options);
          }
        },
      },
      cookieOptions: {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: false,
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user || !data.session) {
    await logAdminAction({
      actorId: null,
      actorEmail: email,
      action: "auth.login_failed",
      entity: "admin_auth",
      entityId: email,
      metadata: { reason: "invalid_credentials", ip },
    });
    return NextResponse.json(
      { error: "Email atau password salah." },
      { status: 401 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("admin login profile lookup error:", profileError.message);
    await supabase.auth.signOut();
    await logAdminAction({
      actorId: data.user.id,
      actorEmail: email,
      action: "auth.login_failed",
      entity: "admin_auth",
      entityId: data.user.id,
      metadata: { reason: "profile_lookup_error", ip },
    });
    return NextResponse.json(
      { error: "Gagal memuat profil. Coba lagi." },
      { status: 500 }
    );
  }

  if (!profile || profile.role !== "admin") {
    await supabase.auth.signOut();
    await logAdminAction({
      actorId: data.user.id,
      actorEmail: email,
      action: "auth.login_failed",
      entity: "admin_auth",
      entityId: data.user.id,
      metadata: { reason: "not_admin", role: profile?.role ?? null, ip },
    });
    return NextResponse.json(
      { error: "Akun ini tidak memiliki akses admin." },
      { status: 403 }
    );
  }

  rateLimitReset(`admin-login:${ip}`);

  await logAdminAction({
    actorId: data.user.id,
    actorEmail: email,
    action: "auth.login_succeeded",
    entity: "admin_auth",
    entityId: data.user.id,
    metadata: { ip },
  });

  // Return a JSON success response and attach the Supabase auth cookies
  // that the @supabase/ssr client queued via setAll. The client form
  // performs the navigation to /admin after this resolves.
  const response = NextResponse.json({ ok: true });
  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options as any);
  }
  return response;
}
