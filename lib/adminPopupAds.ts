import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type PopupAd = {
  id: number;
  title: string;
  subtitle?: string;
  body: string;
  image_url: string;
  storage_path: string;
  button_text?: string;
  button_link?: string;
  position: "center" | "bottom_right";
  status: boolean;
  start_date?: string | null;
  end_date?: string | null;
  dismiss_minutes: number;
  audience: "logged_in" | "all" | "guest";
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export async function getAllPopupAds(): Promise<PopupAd[]> {
  const { data, error } = await supabaseAdmin
    .from("popup_ads")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("ERROR MEMUAT POPUP ADS:", error);
    return [];
  }

  return data as PopupAd[];
}

export async function savePopupAds(popup: Omit<PopupAd, "id" | "created_at" | "updated_at">): Promise<PopupAd | null> {
  const { data, error } = await supabaseAdmin
    .from("popup_ads")
    .upsert([popup])
    .select("*");

  if (error) {
    console.error("ERROR SIMPAN POPUP ADS:", error);
    return null;
  }

  return data?.[0] as PopupAd;
}

export async function deletePopupAds(id: number): Promise<void> {
  const { error } = await supabaseAdmin
    .from("popup_ads")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("ERROR HAPUS POPUP ADS:", error);
  }
}

// Create new popup
export async function createPopupAds(popup: Omit<PopupAd, "id" | "created_at" | "updated_at">): Promise<PopupAd | null> {
  const { data, error } = await supabaseAdmin
    .from("popup_ads")
    .insert([popup])
    .select("*");

  if (error) {
    console.error("ERROR CREATE POPUP ADS:", error);
    return null;
  }

  return data?.[0] as PopupAd;
}