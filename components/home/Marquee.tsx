"use client";

import { useT } from "../LocaleProvider";

interface MarqueeProps {
  items?: string[];
}

function MarqueeLane({
  items,
  direction = "left",
  duration = 30,
  className = "",
  textClass = "text-sm",
  divider = "✦",
}: {
  items: string[];
  direction?: "left" | "right";
  duration?: number;
  className?: string;
  textClass?: string;
  divider?: string;
}) {
  const looped = [...items, ...items, ...items, ...items];
  return (
    <div className={`relative overflow-hidden border-y border-white/[0.06] py-5 ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-black to-transparent md:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-black to-transparent md:w-24" />
      <div
        className="flex w-max gap-12 whitespace-nowrap"
        style={{
          animation: `marquee-${direction} ${duration}s linear infinite`,
        }}
      >
        {looped.map((item, i) => (
          <div
            key={`${item}-${i}`}
            className={`flex items-center gap-12 font-black uppercase tracking-[0.3em] text-white/40 transition-all duration-300 hover:tracking-[0.45em] hover:text-white/70 ${textClass}`}
          >
            <span className="relative">{item}</span>
            <span
              className="text-[#d7ff53]/60"
              style={{
                animation: `pulse-soft ${1.5 + (i % 4) * 0.3}s ease-in-out infinite`,
                animationDelay: `${(i % 5) * 0.1}s`,
              }}
            >
              {divider}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Marquee({ items: itemsProp }: MarqueeProps) {
  const t = useT();
  const fallback = t.home.marquee.items;
  const items = itemsProp && itemsProp.length > 0 ? itemsProp : fallback;
  if (!items || items.length === 0) return null;
  return null;
}
