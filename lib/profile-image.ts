import { supabasePublic } from "./supabasePublic";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export type UploadResult = {
  success: boolean;
  url?: string;
  error?: string;
};

/**
 * Validate a file for profile image upload
 */
export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Format file tidak didukung. Gunakan JPG, PNG, atau WebP.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Ukuran file terlalu besar. Maksimal 2 MB.";
  }

  return null;
}

/**
 * Upload profile image to Supabase Storage.
 *
 * Returns the *path* stored in the bucket (e.g. "userId/avatar-...jpg"),
 * NOT the public URL. Callers (navbar / account page) prepend the public
 * Supabase storage base URL at render time, matching the convention used
 * for the `profile_image_url` column elsewhere in the app.
 */
export async function uploadProfileImage(
  userId: string,
  file: File
): Promise<UploadResult> {
  const validationError = validateFile(file);
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    // Generate unique filename
    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extension}`;

    const { error: uploadError } = await supabasePublic.storage
      .from("avatars")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: "Gagal mengunggah foto." };
    }

    // Return the storage path, not the public URL.
    return { success: true, url: fileName };
  } catch {
    return { success: false, error: "Terjadi kesalahan saat mengunggah foto." };
  }
}

/**
 * Delete profile image from storage. Accepts a path (e.g. "userId/file.jpg")
 * or a full public URL; both are normalized to the bucket-relative path.
 */
export async function deleteProfileImage(fileName: string): Promise<boolean> {
  try {
    const path = extractFileName(fileName) ?? fileName.replace(/^\//, "");
    if (!path) return false;
    const { error } = await supabasePublic.storage
      .from("avatars")
      .remove([path]);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Extract path from a public URL or a leading-slash path.
 * URL format: https://...supabase.co/storage/v1/object/public/avatars/{path}
 */
export function extractFileName(url?: string | null): string | null {
  if (!url) return null;
  // Already a path like "userId/avatar.jpg" or "/userId/avatar.jpg"
  if (!/^https?:\/\//i.test(url)) {
    return url.replace(/^\//, "") || null;
  }
  const parts = url.split("/");
  const idx = parts.findIndex((p) => p === "avatars");
  if (idx === -1 || idx + 1 >= parts.length) return null;
  return parts.slice(idx + 1).join("/");
}

/**
 * Get initials for default avatar
 */
export function getInitials(fullName: string): string {
  const names = fullName.trim().split(" ").filter(Boolean);
  if (names.length === 0) return "?";
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}
