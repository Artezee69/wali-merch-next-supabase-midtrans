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
    <div className={`relative overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#0b0b0b] to-transparent md:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#0b0b0b] to-transparent md:w-24" />
      <div
        className="flex w-max gap-12 whitespace-nowrap"
        style={{
          animation: `marquee-${direction} ${duration}s linear infinite`,
        }}
      >
        {looped.map((item, i) => (
          <div
            key={`${item}-${i}`}
            className={`flex items-center gap-12 font-black uppercase tracking-[0.3em] text-white/55 transition-all duration-300 hover:tracking-[0.45em] hover:text-white/85 ${textClass}`}
          >
            <span
              className="relative"
              style={{
                textShadow:
                  direction === "left"
                    ? "0.5px 0 0 rgba(215,255,83,0.4), -0.5px 0 0 rgba(94,139,255,0.4)"
                    : "0.5px 0 0 rgba(94,139,255,0.4), -0.5px 0 0 rgba(215,255,83,0.4)",
              }}
            >
              {item}
            </span>
            <span
              className="text-[#d7ff53]"
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
  const safeItems = items.length < 4 ? [...items, ...items, ...items, ...items] : items;

  return (
    <section
      id="section-marquee"
      className="relative overflow-hidden border-y border-white/10 bg-[#0b0b0b] py-3"
      aria-label="Highlight"
    >
      <div className="pointer-events-none absolute inset-0 diag-stripes" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d7ff53]/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#5e8bff]/40 to-transparent" />
      <div className="pointer-events-none absolute -left-20 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-[#d7ff53]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-[#5e8bff]/10 blur-3xl" />

      <MarqueeLane items={safeItems} direction="left" duration={38} textClass="text-sm" />

      <div className="relative my-2 h-px overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div
          className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#d7ff53]/50 to-transparent"
          style={{ animation: "shimmer 4s linear infinite", backgroundSize: "200% 100%" }}
        />
      </div>

      <MarqueeLane
        items={[...safeItems].reverse()}
        direction="right"
        duration={50}
        textClass="text-xs"
        divider="◆"
      />
    </section>
  );
}
