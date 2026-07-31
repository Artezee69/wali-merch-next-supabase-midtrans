import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export type PopupAd = {
  id: number;
  image_url: string;
  link: string;
  status: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export async function getAllPopupAds(): Promise<PopupAd[]> {
  const { data, error } = await supabaseAdmin
    .from("popup_ads")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return [];
  return data as PopupAd[];
}

export async function savePopupAds(popup: Partial<PopupAd>): Promise<void> {
  await supabaseAdmin.from("popup_ads").upsert(popup);
}

export async function deletePopupAds(id: number): Promise<void> {
  await supabaseAdmin.from("popup_ads").delete().eq("id", id);
}
