"use client";

import { useLocale } from "@/components/LocaleProvider";
import type { Messages } from "./types";

/**
 * Hook to access translated messages from anywhere inside <LocaleProvider />.
 * Returns the current locale's Messages dictionary.
 *
 * The LocaleProvider always defaults to "id" on the server, so the first
 * client render matches the server render — no hydration mismatch.
 */
export function useT(): Messages {
  const { t } = useLocale();
  return t;
}
