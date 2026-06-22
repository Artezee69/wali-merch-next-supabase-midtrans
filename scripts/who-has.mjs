#!/usr/bin/env node
// Diagnostic helper: query Supabase directly to find which row holds a given
// email/phone. Useful when registration says "already registered" but the user
// believes the input is new.
//
// Usage:
//   node scripts/who-has.mjs email someone@example.com
//   node scripts/who-has.mjs phone 081234567890
//
// Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local (or env).

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
if (existsSync(envPath)) {
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)\s*$/);
    if (!m) continue;
    if (process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(2);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function normalizeEmail(v) {
  return v.trim().toLowerCase();
}
function normalizePhone(v) {
  let s = v.replace(/[\s\-()]/g, "");
  if (s.startsWith("+62")) s = "0" + s.slice(3);
  else if (s.startsWith("62")) s = "0" + s.slice(2);
  return s;
}
function mask(value, kind) {
  if (!value) return "";
  if (kind === "email") {
    const [local, domain] = value.split("@");
    if (!domain) return value;
    return local.slice(0, 2) + "*".repeat(Math.max(local.length - 2, 1)) + "@" + domain;
  }
  if (value.length <= 4) return "*".repeat(value.length);
  return value.slice(0, 3) + "*".repeat(value.length - 5) + value.slice(-2);
}

const field = process.argv[2];
const raw = process.argv[3];
if (!field || !raw || (field !== "email" && field !== "phone")) {
  console.error("Usage: node scripts/who-has.mjs <email|phone> <value>");
  process.exit(1);
}

const value = field === "email" ? normalizeEmail(raw) : normalizePhone(raw);

async function run() {
  console.log(`Querying ${field} = ${mask(value, field)}  (raw: ${raw})`);
  console.log("");

  // auth.users
  let authQuery;
  if (field === "email") {
    authQuery = admin
      .from("auth.users" as any)
      .select("id, email, phone, created_at, last_sign_in_at, raw_user_meta_data")
      .ilike("email", value);
  } else {
    authQuery = admin
      .from("auth.users" as any)
      .select("id, email, phone, created_at, last_sign_in_at, raw_user_meta_data")
      .or(`phone.eq.${value},raw_user_meta_data->>phone.ilike.%${value}%`);
  }
  const { data: authHits, error: authErr } = await authQuery.limit(20);
  if (authErr) {
    console.error("auth.users error:", authErr.message);
  } else {
    console.log(`auth.users hits: ${authHits?.length ?? 0}`);
    for (const u of authHits ?? []) {
      console.log("  -", {
        id: u.id,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email: u.email ? mask(u.email, "email") : null,
        phone: u.phone ? mask(u.phone, "phone") : null,
        meta_phone: u.raw_user_meta_data?.phone ?? null,
        meta_email: u.raw_user_meta_data?.email ?? null,
        meta_full_name: u.raw_user_meta_data?.full_name ?? null,
      });
    }
  }
  console.log("");

  // profiles
  let profQuery;
  if (field === "email") {
    profQuery = admin
      .from("profiles" as any)
      .select("id, full_name, phone, email, created_at")
      .ilike("email", value);
  } else {
    profQuery = admin
      .from("profiles" as any)
      .select("id, full_name, phone, email, created_at")
      .eq("phone", value);
  }
  const { data: profHits, error: profErr } = await profQuery.limit(20);
  if (profErr) {
    console.error("profiles error:", profErr.message);
  } else {
    console.log(`profiles hits: ${profHits?.length ?? 0}`);
    for (const p of profHits ?? []) {
      console.log("  -", {
        id: p.id,
        full_name: p.full_name,
        email: p.email ? mask(p.email, "email") : null,
        phone: p.phone ? mask(p.phone, "phone") : null,
        created_at: p.created_at,
      });
    }
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
