"use client";

import { useT } from "../LocaleProvider";

interface MarqueeProps {
  items?: string[];
}

export default function Marquee({ items: itemsProp }: MarqueeProps) {
  const t = useT();
  const fallback = t.home.marquee.items;
  const items = itemsProp && itemsProp.length > 0 ? itemsProp : fallback;
  if (!items || items.length === 0) return null;

  const looped = [...items, ...items, ...items, ...items];

  return (
    <div className="relative overflow-hidden bg-black/50 border-y border-white/5 py-3">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-black to-transparent md:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-black to-transparent md:w-24" />
      <div
        className="flex w-max gap-12 whitespace-nowrap"
        style={{ animation: "marquee-left 30s linear infinite" }}
      >
        {looped.map((item, i) => (
          <div
            key={`${item}-${i}`}
            className="flex items-center gap-12 font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-400 transition-all duration-300 hover:tracking-[0.4em] hover:text-white text-xs sm:text-sm"
          >
            <span>{item}</span>
            <span className="text-[#d7ff53]">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}
