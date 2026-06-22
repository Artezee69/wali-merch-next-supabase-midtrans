"use client";

import { useState, useEffect, useCallback } from "react";
import { supabasePublic } from "./supabasePublic";
import type { Session, User } from "@supabase/supabase-js";

// ===== Auth state hook (client-side only) =====
export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabasePublic.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabasePublic.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}

// ===== Auth helper hook =====
export function useAuthHook() {
  const { session, loading } = useSupabaseSession();
  const user = session?.user ?? null;

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabasePublic.auth.signInWithPassword({
        email,
        password,
      });
      return error;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const signOut = useCallback(async () => {
    await supabasePublic.auth.signOut();
  }, []);

  return { user, session, loading, signIn, signOut };
}
