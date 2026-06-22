import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/admin/apiGuard";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { logAdminAction } from "@/lib/adminAudit";

const supabaseAdmin = getSupabaseAdmin();

const ALLOWED_GROUPS = new Set([
  "store_general",
  "homepage_header",
  "homepage_hero",
  "homepage_stats",
  "homepage_trust_badges",
  "homepage_marquee",
  "homepage_why_wali",
  "homepage_how_to_order",
  "homepage_cta",
  "homepage_faq",
  "homepage_latest_drop",
  "homepage_sections",
  "homepage_footer",
  "homepage_seo",
]);

export async function POST(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) {
    return guard.response;
  }
  const session = guard.user;

  let body: { group?: string; value?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const group = body.group;
  if (!group || !ALLOWED_GROUPS.has(group)) {
    return NextResponse.json(
      { error: `Group tidak dikenal: ${group}` },
      { status: 400 }
    );
  }

  if (body.value === undefined || body.value === null) {
    return NextResponse.json(
      { error: "Value tidak boleh kosong" },
      { status: 400 }
    );
  }

  const serialized = JSON.stringify(body.value);
  if (serialized.length > 200_000) {
    return NextResponse.json(
      { error: "Value terlalu besar (maks 200KB)" },
      { status: 400 }
    );
  }

  try {
    console.log("[settings/save] Saving group:", group, "size:", serialized.length);
    const { error } = await supabaseAdmin
      .from("store_settings")
      .upsert(
        {
          key: group,
          value: serialized,
          updated_at: new Date().toISOString(),
          updated_by: session.id,
        },
        { onConflict: "key" }
      );
    if (error) {
      console.error("[settings/save] Upsert error:", error.message, error.details);
      return NextResponse.json(
        { error: error.message || "Gagal menyimpan" },
        { status: 500 }
      );
    }
    console.log("[settings/save] Success");

  await logAdminAction({
    actorId: session.id,
    actorEmail: session.email,
    action: "settings.updated",
    entity: "store_settings",
    entityId: group,
    after: { group, size: serialized.length },
  });

  } catch (saveErr) {
    console.error("[settings/save] Unexpected error:", saveErr);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal" },
      { status: 500 }
    );
  }

  // Invalidate caches so the homepage picks up the new values immediately.
  revalidatePath("/");

  return NextResponse.json({ ok: true, group });
}

export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.ok) {
    return guard.response;
  }

  const { data, error } = await supabaseAdmin
    .from("store_settings")
    .select("key, value");

  if (error) {
    return NextResponse.json(
      { error: error.message || "Gagal membaca" },
      { status: 500 }
    );
  }

  return NextResponse.json({ rows: data ?? [] });
}
