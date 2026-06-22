import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  field?: "email" | "phone";
  value?: string;
};

function normalizeEmail(v: string) {
  return v.trim().toLowerCase();
}

function normalizePhone(v: string) {
  let s = v.replace(/[\s\-()]/g, "");
  if (s.startsWith("+62")) s = "0" + s.slice(3);
  else if (s.startsWith("62")) s = "0" + s.slice(2);
  return s;
}

function mask(value: string, kind: "email" | "phone") {
  if (!value) return "";
  if (kind === "email") {
    const [local, domain] = value.split("@");
    if (!domain) return value;
    const head = local.slice(0, 2);
    return `${head}${"*".repeat(Math.max(local.length - 2, 1))}@${domain}`;
  }
  if (value.length <= 4) return "*".repeat(value.length);
  return value.slice(0, 3) + "*".repeat(value.length - 5) + value.slice(-2);
}

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url || !serviceKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Server belum dikonfigurasi dengan service role key.",
      },
      { status: 500 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Body tidak valid" }, { status: 400 });
  }

  const field = body.field;
  const raw = (body.value ?? "").trim();
  if (!raw) {
    return NextResponse.json({ ok: false, error: "value kosong" }, { status: 400 });
  }
  if (field !== "email" && field !== "phone") {
    return NextResponse.json({ ok: false, error: "field harus email/phone" }, { status: 400 });
  }

  const value = field === "email" ? normalizeEmail(raw) : normalizePhone(raw);

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Look up in auth.users (source of truth for login accounts)
  let authHits: Array<{
    id: string;
    email: string | null;
    phone: string | null;
    created_at: string;
    last_sign_in_at: string | null;
    raw_user_meta_data: any;
  }> = [];

  if (field === "email") {
    // auth.users has no "email" unique index we can rely on for arbitrary
    // substring match, but it does enforce case-insensitive uniqueness via
    // citext. Use ilike on the normalized form.
    const { data, error } = await admin
      .from("auth.users" as any)
      .select("id, email, phone, created_at, last_sign_in_at, raw_user_meta_data")
      .ilike("email", value)
      .limit(20);
    if (error) {
      return NextResponse.json(
        { ok: false, error: "Gagal query auth.users: " + error.message },
        { status: 500 }
      );
    }
    authHits = (data ?? []) as any;
  } else {
    // Phone: query auth.users.identities or raw_user_meta_data->>'phone'.
    // Note: Supabase auth may store phone on the user (phone column) or in
    // raw_user_meta_data depending on flow. We check both.
    const { data: byPhone, error: e1 } = await admin
      .from("auth.users" as any)
      .select("id, email, phone, created_at, last_sign_in_at, raw_user_meta_data")
      .eq("phone", value)
      .limit(20);
    if (e1) {
      return NextResponse.json(
        { ok: false, error: "Gagal query auth.users (phone): " + e1.message },
        { status: 500 }
      );
    }
    // Also peek in raw_user_meta_data->>'phone' for the +62 prefixed form
    const { data: byMeta } = await admin
      .from("auth.users" as any)
      .select("id, email, phone, created_at, last_sign_in_at, raw_user_meta_data")
      .filter("raw_user_meta_data->>phone", "ilike", `%${value}%`)
      .limit(20);
    const seen = new Set<string>();
    authHits = [...(byPhone ?? []), ...(byMeta ?? [])].filter((u) => {
      if (seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    });
  }

  // 2) Look up in public.profiles (mirror of selected fields)
  let profileHits: Array<{ id: string; full_name: string; phone: string; email: string }> = [];
  if (field === "email") {
    const { data } = await admin
      .from("profiles" as any)
      .select("id, full_name, phone, email")
      .ilike("email", value)
      .limit(20);
    profileHits = (data ?? []) as any;
  } else {
    const { data } = await admin
      .from("profiles" as any)
      .select("id, full_name, phone, email")
      .eq("phone", value)
      .limit(20);
    profileHits = (data ?? []) as any;
  }

  return NextResponse.json({
    ok: true,
    input: { field, raw, normalized: value, masked: mask(value, field) },
    auth_users: authHits.map((u) => ({
      id: u.id,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email: u.email ? mask(u.email, "email") : null,
      phone: u.phone ? mask(u.phone, "phone") : null,
      signup_meta_phone: u.raw_user_meta_data?.phone
        ? mask(String(u.raw_user_meta_data.phone), "phone")
        : null,
      signup_meta_email: u.raw_user_meta_data?.email
        ? mask(String(u.raw_user_meta_data.email), "email")
        : null,
    })),
    profiles: profileHits.map((p) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email ? mask(p.email, "email") : null,
      phone: p.phone ? mask(p.phone, "phone") : null,
    })),
  });
}
