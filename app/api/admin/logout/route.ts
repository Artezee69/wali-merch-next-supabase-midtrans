import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { logAdminAction } from "@/lib/adminAudit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let actorId: string | null = null;
  let actorEmail: string | null = null;

  try {
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
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server Components cannot set cookies; only relevant in route handlers.
            }
          },
        },
      }
    );

    // Resolve the session user *before* signOut so the audit row can
    // attribute the logout to a known actor. We deliberately do not
    // fail the request if getUser errors — logout should still work.
    const { data: userData } = await supabase.auth.getUser();
    actorId = userData?.user?.id ?? null;
    actorEmail = userData?.user?.email ?? null;

    await supabase.auth.signOut();
  } catch (err) {
    console.error("admin logout error:", err instanceof Error ? err.message : err);
  }

  // Audit is best-effort and never throws. Logging on logout gives
  // us a paired success/failure trail alongside login events.
  await logAdminAction({
    actorId,
    actorEmail,
    action: "auth.logout",
    entity: "admin_auth",
    entityId: actorId ?? "unknown",
  });

  return NextResponse.json({ ok: true });
}
