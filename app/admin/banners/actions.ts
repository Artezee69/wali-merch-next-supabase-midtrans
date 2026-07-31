"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import { logAdminAction } from "@/lib/adminAudit";

const POSITIONS = ["hero", "right_top", "right_bottom"] as const;
type BannerPosition = (typeof POSITIONS)[number];

const MAX_TITLE = 200;
const MAX_SUBTITLE = 400;
const MAX_BUTTON_TEXT = 60;
const MAX_URL = 500;
const MAX_IMAGE_URL = 1000;
const MAX_PATH = 500;

export type BannerFormState =
  | { ok: true; id: number }
  | { ok: false; error: string };

function sanitizeString(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.slice(0, max).trim();
}

function parsePosition(value: unknown): BannerPosition | null {
  if (typeof value !== "string") return null;
  return (POSITIONS as readonly string[]).includes(value)
    ? (value as BannerPosition)
    : null;
}

function parseSortOrder(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(9999, Math.trunc(n)));
}

function parseDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Delete a file from the banners bucket. Failure is non-fatal — logged and ignored. */
async function deleteStoragePath(path: string | null | undefined): Promise<void> {
  if (!path) return;
  // Jangan hapus path placeholder dari seeder
  if (path.startsWith("seed/")) return;
  try {
    await supabaseAdmin.storage.from("banners").remove([path]);
  } catch (err) {
    console.warn("[banners] gagal hapus file storage:", path, err);
  }
}

type BannerInput = {
  title: string;
  subtitle: string;
  imageUrl: string;
  storagePath: string;
  buttonText: string;
  buttonLink: string;
  position: BannerPosition;
  sortOrder: number;
  status: boolean;
  startDate: string | null;
  endDate: string | null;
};

function buildBannerInput(form: FormData): {
  ok: true;
  value: BannerInput;
} | { ok: false; error: string } {
  const title = sanitizeString(form.get("title"), MAX_TITLE);
  if (!title) return { ok: false, error: "Nama banner wajib diisi." };

  const subtitle = sanitizeString(form.get("subtitle"), MAX_SUBTITLE);
  const imageUrl = sanitizeString(form.get("image_url"), MAX_IMAGE_URL);
  const storagePath = sanitizeString(form.get("storage_path"), MAX_PATH);
  if (!imageUrl || !storagePath) {
    return { ok: false, error: "Gambar banner wajib diupload." };
  }

  const buttonText = sanitizeString(form.get("button_text"), MAX_BUTTON_TEXT);
  const buttonLink = sanitizeString(form.get("button_link"), MAX_URL);

  const position = parsePosition(form.get("position"));
  if (!position) {
    return { ok: false, error: "Posisi banner tidak valid." };
  }

  const status = form.get("status") === "on" || form.get("status") === "true";
  const sortOrder = parseSortOrder(form.get("sort_order"));
  const startDate = parseDate(form.get("start_date"));
  const endDate = parseDate(form.get("end_date"));

  if (startDate && endDate && new Date(startDate).getTime() > new Date(endDate).getTime()) {
    return { ok: false, error: "Tanggal mulai tidak boleh setelah tanggal selesai." };
  }

  if (buttonText && !buttonLink) {
    return { ok: false, error: "Link CTA wajib diisi jika teks CTA diisi." };
  }

  return {
    ok: true,
    value: {
      title,
      subtitle,
      imageUrl,
      storagePath,
      buttonText,
      buttonLink,
      position,
      sortOrder,
      status,
      startDate,
      endDate,
    },
  };
}

export async function createBanner(
  _prev: BannerFormState | null,
  form: FormData
): Promise<BannerFormState> {
  const session = await requireAdmin();
  const parsed = buildBannerInput(form);
  if (!parsed.ok) return parsed;

  const v = parsed.value;
  const { data, error } = await supabaseAdmin
    .from("banners")
    .insert({
      title: v.title,
      subtitle: v.subtitle || null,
      image_url: v.imageUrl,
      storage_path: v.storagePath,
      button_text: v.buttonText || null,
      button_link: v.buttonLink || null,
      position: v.position,
      sort_order: v.sortOrder,
      status: v.status,
      start_date: v.startDate,
      end_date: v.endDate,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createBanner] insert error:", error.message);
    return { ok: false, error: error.message };
  }

  const id = (data as { id: number } | null)?.id;
  await logAdminAction({
    actorId: session.userId,
    actorEmail: session.email,
    action: "banner.created",
    entity: "banner",
    entityId: String(id ?? ""),
    metadata: { position: v.position, title: v.title },
  });

  revalidatePath("/admin/banners");
  revalidatePath("/");

  if (id) return { ok: true, id };
  redirect("/admin/banners");
}

export async function updateBanner(
  id: number,
  _prev: BannerFormState | null,
  form: FormData
): Promise<BannerFormState> {
  const session = await requireAdmin();
  const parsed = buildBannerInput(form);
  if (!parsed.ok) return parsed;

  // Ambil row lama untuk deteksi pergantian gambar
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from("banners")
    .select("image_url, storage_path, position")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return { ok: false, error: fetchErr.message };
  }

  const v = parsed.value;

  const { error } = await supabaseAdmin
    .from("banners")
    .update({
      title: v.title,
      subtitle: v.subtitle || null,
      image_url: v.imageUrl,
      storage_path: v.storagePath,
      button_text: v.buttonText || null,
      button_link: v.buttonLink || null,
      position: v.position,
      sort_order: v.sortOrder,
      status: v.status,
      start_date: v.startDate,
      end_date: v.endDate,
    })
    .eq("id", id);

  if (error) {
    console.error("[updateBanner] update error:", error.message);
    return { ok: false, error: error.message };
  }

  // Hapus gambar lama hanya jika path benar-benar berbeda (artinya admin
  // upload gambar baru).
  const oldPath = (existing as { storage_path?: string | null } | null)?.storage_path;
  if (oldPath && oldPath !== v.storagePath) {
    await deleteStoragePath(oldPath);
  }

  await logAdminAction({
    actorId: session.userId,
    actorEmail: session.email,
    action: "banner.updated",
    entity: "banner",
    entityId: String(id),
    metadata: { position: v.position, title: v.title },
  });

  revalidatePath("/admin/banners");
  revalidatePath("/");
  revalidatePath(`/admin/banners/${id}/edit`);

  return { ok: true, id };
}

export async function deleteBanner(id: number): Promise<{ ok: boolean; error?: string }> {
  const session = await requireAdmin();

  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from("banners")
    .select("storage_path, title")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return { ok: false, error: fetchErr.message };
  }
  if (!existing) {
    return { ok: true }; // idempotent
  }

  const { error } = await supabaseAdmin.from("banners").delete().eq("id", id);
  if (error) {
    console.error("[deleteBanner] delete error:", error.message);
    return { ok: false, error: error.message };
  }

  const path = (existing as { storage_path?: string | null }).storage_path;
  await deleteStoragePath(path);

  await logAdminAction({
    actorId: session.userId,
    actorEmail: session.email,
    action: "banner.deleted",
    entity: "banner",
    entityId: String(id),
    metadata: { title: (existing as { title?: string }).title },
  });

  revalidatePath("/admin/banners");
  revalidatePath("/");

  return { ok: true };
}

export async function toggleBannerStatus(
  id: number,
  nextStatus: boolean
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireAdmin();
  const { error } = await supabaseAdmin
    .from("banners")
    .update({ status: nextStatus })
    .eq("id", id);
  if (error) {
    return { ok: false, error: error.message };
  }
  await logAdminAction({
    actorId: session.userId,
    actorEmail: session.email,
    action: nextStatus ? "banner.activated" : "banner.deactivated",
    entity: "banner",
    entityId: String(id),
  });
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true };
}
