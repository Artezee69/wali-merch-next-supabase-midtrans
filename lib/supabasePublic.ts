import { createClient } from "@supabase/supabase-js";
import type { Session, User } from "@supabase/supabase-js";

export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Alias for clarity
export const supabase = supabasePublic;

export type { Session, User };
