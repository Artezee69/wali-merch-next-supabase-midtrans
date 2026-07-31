import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type BannerPosition = "hero" | "right_top" | "right_bottom";

export type Banner = {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string;
  storage_path: string;
  button_text: string | null;
  button_link: string | null;
  position: BannerPosition;
  sort_order: number;
  status: boolean;
  start_date: string | null;
  end_date: string | null;
  hide_overlay: boolean;
  created_at: string;
  updated_at: string;
};

/** Active banners visible to the public (RLS already filters, but we double-check window). */
function isCurrentlyActive(b: Banner): boolean {
  if (!b.status) return false;
  const now = Date.now();
  if (b.start_date && new Date(b.start_date).getTime() > now) return false;
  if (b.end_date && new Date(b.end_date).getTime() < now) return false;
  return true;
}

export async function getActiveBannersByPosition(
  position: BannerPosition
): Promise<Banner[]> {
  const { data, error } = await supabaseAdmin
    .from("banners")
    .select(
      "id, title, subtitle, image_url, storage_path, button_text, button_link, position, sort_order, status, start_date, end_date, hide_overlay, created_at, updated_at"
    )
    .eq("position", position)
    .eq("status", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getActiveBannersByPosition] error:", error.message);
    return [];
  }

  return ((data ?? []) as Banner[]).filter(isCurrentlyActive);
}
