import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/apiGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logAdminAction } from "@/lib/adminAudit";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const BUCKET = "banners";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

export async function POST(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session.ok) {
    return session.response;
  }
  const adminUser = session.user;

  const ip = getClientIp(req.headers);
  const rl = rateLimit(`banner-upload:${adminUser.id}:${ip}`, {
    limit: 30,
    windowSec: 60,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Terlalu banyak upload, coba lagi dalam ${rl.resetInSec}s` },
      { status: 429 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Tipe file tidak didukung: ${file.type}` },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Ukuran file melebihi ${Math.round(MAX_BYTES / 1024 / 1024)}MB` },
      { status: 400 }
    );
  }

  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const safeName = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9-_]/gi, "-")
    .toLowerCase()
    .slice(0, 40) || "banner";
  const fileName = `${Date.now()}-${safeName}.${ext}`;
  const path = `banners/${fileName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (upErr) {
    return NextResponse.json(
      { error: upErr.message || "Upload failed" },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

  await logAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "banner.uploaded",
    entity: "banner",
    entityId: path,
    metadata: { size: file.size, type: file.type },
  });

  return NextResponse.json({ url: publicUrl, path });
}
