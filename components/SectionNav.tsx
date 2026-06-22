"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useT } from "@/lib/i18n/useT";

type SectionInfo = { id: string; label: string };

const SECTIONS: SectionInfo[] = [
  { id: "home-hero", label: "hero" },
  { id: "section-marquee", label: "marquee" },
  { id: "section-products", label: "products" },
  { id: "why-wali", label: "why" },
  { id: "how-to-order", label: "how" },
  { id: "cta", label: "cta" },
  { id: "faq", label: "faq" },
];

export default function SectionNav() {
  const t = useT();
  const [activeIdx, setActiveIdx] = useState(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        let current = 0;
        for (let i = 0; i < SECTIONS.length; i++) {
          const el = document.getElementById(SECTIONS[i].id);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.4) {
            current = i;
          }
        }
        setActiveIdx(current);
        ticking.current = false;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const scrollToSection = useCallback((idx: number) => {
    if (idx < 0 || idx >= SECTIONS.length) return;
    const el = document.getElementById(SECTIONS[idx].id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const goUp = useCallback(() => {
    scrollToSection(activeIdx - 1);
  }, [activeIdx, scrollToSection]);

  const goDown = useCallback(() => {
    scrollToSection(activeIdx + 1);
  }, [activeIdx, scrollToSection]);

  return (
    <nav
      aria-label="Section navigation"
      className="fixed right-3 top-1/2 z-40 -translate-y-1/2 md:right-4"
    >
      <div className="flex flex-col items-center gap-3">
        {/* Up button */}
        <button
          onClick={goUp}
          disabled={activeIdx <= 0}
          aria-label={t.sectionNav.prev}
          title={t.sectionNav.prev}
          className="group relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/60 text-white/70 backdrop-blur-xl transition hover:border-[#d7ff53]/40 hover:bg-[#d7ff53]/10 hover:text-[#d7ff53] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:bg-black/60 disabled:hover:text-white/70 md:h-12 md:w-12"
        >
          <ChevronUp size={18} strokeWidth={2.5} className="transition group-hover:-translate-y-0.5" />
        </button>

        {/* Down button */}
        <button
          onClick={goDown}
          disabled={activeIdx >= SECTIONS.length - 1}
          aria-label={t.sectionNav.next}
          title={t.sectionNav.next}
          className="group relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/60 text-white/70 backdrop-blur-xl transition hover:border-[#d7ff53]/40 hover:bg-[#d7ff53]/10 hover:text-[#d7ff53] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:bg-black/60 disabled:hover:text-white/70 md:h-12 md:w-12"
        >
          <ChevronDown size={18} strokeWidth={2.5} className="transition group-hover:translate-y-0.5" />
        </button>
      </div>
    </nav>
  );
}
