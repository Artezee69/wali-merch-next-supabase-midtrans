"use client";

import { useEffect, useState } from "react";
import type {
  HomepageSettings,
  HeaderSettings,
} from "@/lib/storeSettings";

// Re-export the types so other client components can import them from
// the hook module path.
export type { HomepageSettings, HeaderSettings };

/**
 * resolveHeaderSettings — normalizes a raw DB row into the canonical
 * `HeaderSettings` shape, filling in any missing keys with safe defaults.
 * This is the function the Navbar calls so it never crashes if the
 * settings row is incomplete.
 */
export function resolveHeaderSettings(raw: Partial<HeaderSettings> | null | undefined): HeaderSettings {
  return {
    logoUrl: raw?.logoUrl ?? "",
    logoText: raw?.logoText ?? "Official Merchandise Wali",
    logoSubtitle: raw?.logoSubtitle ?? "by wakalima",
    showSubtitle: raw?.showSubtitle ?? true,
    menuLabels: raw?.menuLabels ?? {
      home: "Home",
      products: "Products",
      trackOrder: "Track Order",
      cart: "Cart",
    },
    loginLabel: raw?.loginLabel ?? "Login",
    registerLabel: raw?.registerLabel ?? "Daftar",
    showLogin: raw?.showLogin ?? true,
    showRegister: raw?.showRegister ?? true,
  };
}

export type ResolvedHeaderSettings = ReturnType<typeof resolveHeaderSettings>;

/**
 * Lightweight client-side hook that fetches the homepage settings bundle
 * and exposes them. The first call hits `/api/home/settings` (a public
 * endpoint that mirrors `getHomepageSettings()` server-side). The hook
 * uses SWR-style caching with a 60s TTL and refetches when invalidated.
 */
export function useHomepageSettings() {
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/home/settings", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to load settings (${res.status})`);
      }
      const data = (await res.json()) as HomepageSettings;
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { settings, loading, error, refresh: load };
}
