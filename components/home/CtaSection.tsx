"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Zap, MessageCircle } from "lucide-react";
import Reveal from "./Reveal";
import { useT } from "../LocaleProvider";

export default function CtaSection() {
  const t = useT();
  return (
    <section
      id="cta"
      data-section-nav
      className="relative overflow-hidden border-t border-white/5 px-4 py-24 md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <Reveal variant="blur-in" className="relative">
          {/* Big spotlight card */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f0f0f] via-[#080808] to-[#0a0a0a] p-10 md:p-16">
            {/* Animated gradient borders */}
            <div
              className="pointer-events-none absolute -inset-px rounded-3xl opacity-60"
              style={{
                backgroundImage:
                  "conic-gradient(from var(--angle,0deg) at 50% 50%, transparent 0%, rgba(215,255,83,0.4) 30%, transparent 60%)",
                animation: "spin-slow 6s linear infinite",
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                padding: "1px",
              }}
            />

            {/* Aurora blobs */}
            <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(215,255,83,0.25),transparent_70%)] blur-3xl">
              <div
                className="h-full w-full"
                style={{
                  animation: "aurora-drift-1 12s ease-in-out infinite alternate",
                }}
              />
            </div>
            <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,94,219,0.2),transparent_70%)] blur-3xl">
              <div
                className="h-full w-full"
                style={{
                  animation: "aurora-drift-2 15s ease-in-out infinite alternate",
                }}
              />
            </div>

            {/* Grid background */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(215,255,83,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(215,255,83,0.5) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
                maskImage:
                  "radial-gradient(circle_at_center, black 0%, transparent 70%)",
              }}
            />

            <div className="relative z-10 grid gap-10 md:grid-cols-2 md:items-center md:gap-12">
              {/* Left: copy */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#d7ff53]/30 bg-[#d7ff53]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#d7ff53]">
                  <Sparkles className="h-3 w-3" />
                  <span>Stage Culture · Premium</span>
                </div>
                <h2 className="mt-6 text-balance text-4xl font-black leading-[1.05] tracking-tight text-white md:text-6xl">
                  {t.home.cta.title}
                </h2>
                <p className="mt-5 max-w-xl text-balance text-sm leading-relaxed text-white/55 md:text-base">
                  {t.home.cta.subtitle}
                </p>

                {/* Inline feature row */}
                <div className="mt-8 flex flex-wrap items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
                  <span className="inline-flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-[#d7ff53]" />
                    Free Shipping
                  </span>
                  <span className="text-white/15">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-[#d7ff53]" />
                    Member Only Drop
                  </span>
                  <span className="text-white/15">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <MessageCircle className="h-3 w-3 text-[#d7ff53]" />
                    24/7 Support
                  </span>
                </div>
              </div>

              {/* Right: CTA stack */}
              <div className="flex flex-col gap-3">
                <Link
                  href="/products"
                  className="group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[#d7ff53] px-8 py-4 text-sm font-black uppercase tracking-wider text-black transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_-8px_rgba(215,255,83,0.5)]"
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
                  <span className="relative">{t.home.cta.primary}</span>
                  <ArrowRight className="relative h-4 w-4 transition-transform duration-500 group-hover/btn:translate-x-1" />
                </Link>
                <Link
                  href="/track-order"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-black uppercase tracking-wider text-white/85 backdrop-blur transition-all duration-500 hover:border-white/40 hover:bg-white/10"
                >
                  {t.home.cta.secondary}
                </Link>

                {/* Trust strip */}
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex -space-x-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full border-2 border-[#0b0b0b] bg-gradient-to-br from-[#d7ff53] via-[#5e8bff] to-[#ff5edb]"
                        style={{ animation: `spin-slow ${18 + i * 4}s linear infinite` }}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                    2.4k+ members · 18k+ orders
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
