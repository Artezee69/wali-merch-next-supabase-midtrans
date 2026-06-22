"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabasePublic } from "@/lib/supabasePublic";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";
import { upsertProfile, getProfile } from "@/lib/profile";
import { uploadProfileImage } from "@/lib/profile-image";

type SignUpInput = {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  address: string;
  birth_date?: string | null;
  gender?: "male" | "female" | "other" | null;
  privacy_accepted?: boolean;
  avatar?: File | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<Error | null>;
  signUp: (data: SignUpInput) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Load session on mount
  useEffect(() => {
    const abortController = new AbortController();

    const timeoutId = setTimeout(() => {
      console.warn("[AuthProvider] getSession() timed out after 10s");
      abortController.abort();
      setLoading(false);
    }, 10000);

    supabasePublic.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeoutId);
      if (!abortController.signal.aborted) {
        console.log("[AuthProvider] session loaded on mount:", Boolean(session), Boolean(session?.user));
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    }).catch((err) => {
      clearTimeout(timeoutId);
      if (!abortController.signal.aborted) {
        console.error("[AuthProvider] getSession() failed:", err);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabasePublic.auth.onAuthStateChange((event, session) => {
      console.log("[AuthProvider] auth state changed:", event, Boolean(session));
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
      subscription.unsubscribe();
    };
  }, []);

  // Load profile when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    let mounted = true;
    setProfileLoading(true);

    getProfile(user.id)
      .then((p) => {
        if (mounted) {
          setProfile(p);
          setProfileLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setProfileLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<Error | null> => {
      try {
        const { data, error } = await supabasePublic.auth.signInWithPassword({
          email,
          password,
        });

        console.log("signIn result", {
          hasUser: Boolean(data?.user),
          hasSession: Boolean(data?.session),
          userId: data?.user?.id,
        });

        if (error) {
          // Map common Supabase errors to user-friendly messages
          if (error.message.includes("Invalid login credentials")) {
            const err = new Error("Email atau kata sandi salah.");
            return err;
          }
          if (error.message.includes("Email not confirmed")) {
            const err = new Error(
              "Email kamu belum diverifikasi. Periksa inbox email dan klik link verifikasi."
            );
            return err;
          }
          const err = new Error(error.message || "Gagal login.");
          return err;
        }

        // If login succeeded and we have a session, update state immediately
        // so AuthProvider doesn't wait for the onAuthStateChange event
        if (data?.user && data?.session) {
          setSession(data.session);
          setUser(data.user);
          console.log("[AuthProvider] session set immediately after signIn");
        }

        return null;
      } catch (err: any) {
        console.error("[AuthProvider] signIn exception:", err);
        return err instanceof Error ? err : new Error("Gagal login.");
      }
    },
    []
  );

  const signUp = useCallback(
    async (data: SignUpInput): Promise<{ success: boolean; error?: string }> => {
      try {
        // Build metadata payload — sent to Supabase Auth so it is also
        // available via raw_user_meta_data for backfill / server-side reads.
        const metadata: Record<string, unknown> = {
          full_name: data.full_name,
          phone: data.phone,
          address: data.address,
        };
        if (data.birth_date) metadata.birth_date = data.birth_date;
        if (data.gender) metadata.gender = data.gender;
        if (data.privacy_accepted !== undefined) {
          metadata.privacy_accepted = data.privacy_accepted;
        }

        // Create auth user first
        const { data: authData, error: authError } =
          await supabasePublic.auth.signUp({
            email: data.email,
            password: data.password,
            options: { data: metadata },
          });

        if (authError) {
          // Map Supabase errors to user-friendly messages
          if (authError.message.includes("already registered")) {
            return { success: false, error: "Email ini sudah terdaftar." };
          }
          if (authError.message.includes("stronger password")) {
            return { success: false, error: "Kata sandi terlalu lemah. Gunakan minimal 8 karakter dengan angka dan huruf." };
          }
          return { success: false, error: authError.message || "Gagal mendaftar." };
        }

        // Create / upsert profile row.
        if (authData.user) {
          // Upload avatar first (needs user id) so we can store the storage
          // path (not a browser blob URL) in profile_image_url.
          let profileImagePath: string | null = null;
          if (data.avatar) {
            const uploaded = await uploadProfileImage(authData.user.id, data.avatar);
            if (uploaded.success && uploaded.url) {
              profileImagePath = uploaded.url;
            } else if (uploaded.error) {
              // Non-fatal: keep going but surface the issue.
              console.warn("[AuthProvider] avatar upload failed:", uploaded.error);
            }
          }

          // The DB trigger (handle_new_user) creates the profile row from
          // raw_user_meta_data when the auth user is inserted. RLS blocks
          // an anon client from inserting here while the user is awaiting
          // email verification (auth.uid() is null), so we treat the
          // trigger as source of truth and only attempt an upsert if the
          // user is already signed in (e.g. dev with confirm-email off).
          if (authData.session) {
            const upsertResult = await upsertProfile(authData.user.id, {
              full_name: data.full_name,
              phone: data.phone,
              email: data.email,
              address: data.address,
              birth_date: data.birth_date ?? null,
              gender: data.gender ?? null,
              profile_image_url: profileImagePath,
              is_email_verified: Boolean(authData.user.email_confirmed_at),
            });

            if (!upsertResult.success) {
              console.warn("[AuthProvider] profile upsert failed:", upsertResult.error);
            }
          }
        }

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || "Gagal mendaftar." };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabasePublic.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setProfileLoading(true);
    const p = await getProfile(user.id);
    setProfile(p);
    setProfileLoading(false);
  }, [user?.id]);

  const updateProfileData = useCallback(
    async (data: Partial<Profile>): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: "User tidak ditemukan." };

      try {
        const { success, error, data: updated } = await (await import("@/lib/profile")).updateProfile(user.id, data);

        if (success && updated) {
          setProfile(updated);
        }

        return { success, error };
      } catch (err: any) {
        return { success: false, error: err.message || "Gagal memperbarui profil." };
      }
    },
    [user?.id]
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        profileLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateProfile: updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
