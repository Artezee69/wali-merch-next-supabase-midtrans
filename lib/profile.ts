import { supabasePublic } from "./supabasePublic";
import type { Profile, ProfileUpdateInput } from "./types";

export type { Profile, ProfileUpdateInput };

/**
 * Get user profile by ID (public/anon key works with RLS)
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabasePublic
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("getProfile error:", error);
    return null;
  }

  return data as Profile | null;
}

/**
 * Create or update profile (upsert)
 */
export async function upsertProfile(
  userId: string,
  data: {
    full_name: string;
    phone: string;
    email: string;
    address: string;
    birth_date?: string | null;
    gender?: "male" | "female" | "other" | null;
    profile_image_url?: string | null;
    is_email_verified?: boolean;
  }
): Promise<{ success: boolean; error?: string; data?: Profile }> {
  const { data: result, error } = await supabasePublic
    .from("profiles")
    .upsert({
      id: userId,
      ...data,
    })
    .select()
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: result as Profile };
}

/**
 * Update profile (partial update)
 */
export async function updateProfile(
  userId: string,
  data: ProfileUpdateInput
): Promise<{ success: boolean; error?: string; data?: Profile }> {
  const { data: result, error } = await supabasePublic
    .from("profiles")
    .update(data)
    .eq("id", userId)
    .select()
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: result as Profile };
}
