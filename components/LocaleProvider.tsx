"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale, Messages } from "@/lib/i18n/types";
import idMessages from "@/lib/i18n/messages/id";
import enMessages from "@/lib/i18n/messages/en";

const STORAGE_KEY = "wali.locale";
const COOKIE_KEY = "wali_locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const dictionaries: Record<Locale, Messages> = {
  id: idMessages,
  en: enMessages,
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggleLocale: () => void;
  t: Messages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readInitialLocale(): Locale {
  if (typeof document === "undefined") return "id";
  const fromCookie = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_KEY}=`));
  if (fromCookie) {
    const v = fromCookie.split("=")[1];
    if (v === "id" || v === "en") return v;
  }
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "id" || stored === "en") return stored;
  }
  return "id";
}

function persistLocale(next: Locale) {
  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_KEY}=${next}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, next);
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = next === "id" ? "id" : "en";
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const current = readInitialLocale();
    setLocaleState((prev) => {
      if (prev === current) return prev;
      return current;
    });
    persistLocale(current);
    setHydrated(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next: Locale = prev === "id" ? "en" : "id";
      persistLocale(next);
      return next;
    });
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t: dictionaries[locale],
    }),
    [locale, setLocale, toggleLocale]
  );

  // Avoid hydration mismatch: the value is correct post-hydration, and the
  // first render on server uses "id" which matches our default and SEO.
  void hydrated;

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used inside <LocaleProvider />");
  }
  return ctx;
}

export function useT(): Messages {
  return useLocale().t;
}

export const SUPPORTED_LOCALES: Locale[] = ["id", "en"];
