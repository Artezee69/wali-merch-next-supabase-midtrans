"use client";

import { Languages } from "lucide-react";
import { useLocale } from "./LocaleProvider";

export default function LocaleToggle() {
  const { locale, toggleLocale } = useLocale();
  return (
    <button
      type="button"
      onClick={toggleLocale}
      className="group flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-white/60 transition-all duration-300 hover:border-[#d7ff53]/30 hover:bg-[#d7ff53]/5 hover:text-[#d7ff53]"
    >
      <Languages className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-12" />
      <span>{locale === "id" ? "ID" : "EN"}</span>
    </button>
  );
}
