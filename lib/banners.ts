import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Banner, BannerPosition } from "@/lib/banner-types";

export type { Banner, BannerPosition, BannerFocusPoint } from "@/lib/banner-types";
export { bannerObjectPosition } from "@/lib/banner-types";

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
      "id, title, subtitle, image_url, storage_path, button_text, button_link, position, sort_order, status, start_date, end_date, hide_overlay, focus_point, created_at, updated_at"
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
