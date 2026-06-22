import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizePhone } from "@/lib/phone";
import { normalizeEmail } from "@/lib/email";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function adminClient() {
  return createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type LegacyFieldBody = {
  field?: "email" | "phone";
  value?: string;
};

type CombinedBody = {
  email?: string;
  phone?: string;
};

type FieldResult = { available: boolean; reason?: "duplicate" | "invalid" };

type AvailabilityResponse = {
  emailExists: boolean;
  phoneExists: boolean;
  // Legacy fields retained so older clients don't break.
  available?: boolean;
  email?: FieldResult;
  phone?: FieldResult;
  message?: string;
};

async function checkProfile(
  column: "email_norm" | "phone_norm",
  value: string
): Promise<boolean> {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq(column, value)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return Boolean(data);
}

export async function POST(request: NextRequest) {
  let body: LegacyFieldBody & CombinedBody;
  try {
    body = (await request.json()) as LegacyFieldBody & CombinedBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Two request shapes are supported:
  //   1. Legacy: { field: "email" | "phone", value: "..." }
  //   2. Combined: { email: "...", phone: "..." }  (new contract)
  const legacyField: "email" | "phone" | undefined =
    body.field === "email" || body.field === "phone" ? body.field : undefined;

  const emailNorm = normalizeEmail(legacyField === "email" ? body.value : body.email);
  const phoneNormRaw = normalizePhone(legacyField === "phone" ? body.value : body.phone);

  // For the phone, accept legacy "08..." rows during the transition period by
  // also probing the local "0..." form so the duplicate check matches data
  // that was stored before the 62... normalization.
  const localPhone = phoneNormRaw.startsWith("62")
    ? "0" + phoneNormRaw.slice(2)
    : phoneNormRaw.startsWith("0")
    ? phoneNormRaw
    : null;
  const phoneCandidates = localPhone && localPhone !== phoneNormRaw
    ? [phoneNormRaw, localPhone]
    : [phoneNormRaw];

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("check-availability: missing Supabase env vars");
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 500 }
    );
  }

  if (emailNorm == null && !phoneNormRaw) {
    return NextResponse.json(
      { error: "Provide a valid email or phone to check" },
      { status: 400 }
    );
  }

  let emailExists = false;
  let phoneExists = false;

  if (emailNorm) {
    try {
      emailExists = await checkProfile("email_norm", emailNorm);
    } catch (err: any) {
      console.error("check-availability profiles(email_norm):", err?.message);
      return NextResponse.json(
        { error: "Gagal memeriksa ketersediaan akun." },
        { status: 500 }
      );
    }
  }

  if (phoneNormRaw) {
    try {
      const supabase = adminClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .in("phone_norm", phoneCandidates)
        .limit(1);
      if (error) throw error;
      phoneExists = Boolean(data && data.length > 0);
    } catch (err: any) {
      console.error("check-availability profiles(phone_norm):", err?.message);
      return NextResponse.json(
        { error: "Gagal memeriksa ketersediaan akun." },
        { status: 500 }
      );
    }
  }

  // Sanity log — does NOT log raw values verbatim (already normalized), and
  // never logs passwords, tokens, or service-role keys.
  console.log("Availability check:", {
    emailChecked: Boolean(emailNorm),
    phoneChecked: Boolean(phoneNormRaw),
    emailExists,
    phoneExists,
  });

  const response: AvailabilityResponse = {
    emailExists,
    phoneExists,
    // Legacy shape so old clients that read .available / .email / .phone
    // continue to work.
    available: !emailExists && !phoneExists,
    email: emailNorm
      ? { available: !emailExists, reason: emailExists ? "duplicate" : undefined }
      : undefined,
    phone: phoneNormRaw
      ? { available: !phoneExists, reason: phoneExists ? "duplicate" : undefined }
      : undefined,
  };

  return NextResponse.json(response, {
    headers: { "Cache-Control": "no-store" },
  });
}
