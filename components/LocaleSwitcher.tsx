"use client";

import { useLocale } from "@/components/LocaleProvider";

const LANG_LABELS: Record<"id" | "en", string> = {
  id: "ID",
  en: "EN",
};

export default function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  const next = locale === "id" ? "en" : "id";

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={`Ganti bahasa ke ${LANG_LABELS[next]}`}
      title={LANG_LABELS[next]}
      className="inline-flex items-center rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-white/60 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
    >
      {LANG_LABELS[locale]}
      <svg
        className="ml-1 h-3 w-3 text-white/35"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}
