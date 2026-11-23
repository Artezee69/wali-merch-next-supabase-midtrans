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
  focus_point: BannerFocusPoint;
  created_at: string;
  updated_at: string;
};

export type BannerFocusPoint =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

const FOCUS_MAP: Record<BannerFocusPoint, string> = {
  center: "center",
  top: "center top",
  bottom: "center bottom",
  left: "left center",
  right: "right center",
  "top-left": "left top",
  "top-right": "right top",
  "bottom-left": "left bottom",
  "bottom-right": "right bottom",
};

export function bannerObjectPosition(focus: BannerFocusPoint): string {
  return FOCUS_MAP[focus] ?? "center";
}
