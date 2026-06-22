"use client";

import { Truck, ShieldCheck, Recycle, Sparkles, Star, Quote } from "lucide-react";
import Reveal from "./Reveal";
import { useT } from "../LocaleProvider";

const icons = [Truck, ShieldCheck, Recycle, Sparkles];

export default function WhyWali() {
  const t = useT();
  const features = t.home.why.features;
  return (
    <section
      id="why-wali"
      data-section-nav
      className="relative overflow-hidden border-t border-white/5 px-4 py-24 md:px-8 md:py-32"
    >
      {/* Decorative ambient layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(215,255,83,0.08),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 -right-20 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08),transparent_70%)] blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <Reveal className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#d7ff53]/20 bg-[#d7ff53]/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#d7ff53]">
            <Star className="h-3 w-3" />
            {t.home.why.badge}
          </span>
          <h2 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-black leading-[1.05] tracking-tight text-white md:text-6xl">
            {t.home.why.title}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-sm text-white/55 md:text-base">
            {t.home.why.subtitle}
          </p>
        </Reveal>

        {/* Bento grid */}
        <div className="mt-16 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:grid-rows-2 lg:gap-4">
          {/* Quote card — large hero tile */}
          <Reveal
            variant="blur-in"
            delay={0.05}
            className="relative row-span-1 flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f0f0f] via-[#0a0a0a] to-black p-8 lg:col-span-2 lg:row-span-2"
          >
            <Quote className="absolute -top-4 -left-4 h-20 w-20 text-[#d7ff53]/10" strokeWidth={1.5} />
            <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-[radial-gradient(circle_at_center,rgba(215,255,83,0.15),transparent_70%)] blur-2xl" />
            <div className="relative z-10 flex flex-1 flex-col justify-center">
              <p className="text-2xl font-black leading-tight text-white md:text-3xl lg:text-4xl">
                <span className="text-[#d7ff53]">“</span>
                {t.home.why.quote}
                <span className="text-[#d7ff53]">”</span>
              </p>
            </div>
            <div className="relative z-10 mt-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-[#d7ff53]/50 to-transparent" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-white/60">
                — {t.home.why.quoteAuthor}
              </span>
            </div>
          </Reveal>

          {/* Feature cards */}
          {features.map((f, i) => {
            const Icon = icons[i % icons.length];
            return (
              <Reveal
                key={f.title}
                variant="blur-in"
                delay={0.1 + i * 0.06}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-500 hover:border-[#d7ff53]/30 hover:bg-white/[0.04]"
              >
                <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(215,255,83,0.12),transparent_70%)] opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="relative">
                    <div className="absolute inset-0 -m-2 rounded-2xl bg-[#d7ff53]/10 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d7ff53]/30 bg-[#d7ff53]/5 text-[#d7ff53] transition-transform duration-500 group-hover:scale-110">
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                  </div>
                  <span className="text-5xl font-black leading-none text-white/5 transition-colors duration-500 group-hover:text-white/10">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="relative z-10 mt-6 text-base font-black text-white md:text-lg">
                  {f.title}
                </h3>
                <p className="relative z-10 mt-2 text-xs leading-relaxed text-white/55 md:text-sm">
                  {f.desc}
                </p>
              </Reveal>
            );
          })}
        </div>

        {/* Social proof strip */}
        <Reveal
          variant="blur-in"
          delay={0.4}
          className="mt-12 flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.02] via-white/[0.04] to-white/[0.02] p-5 sm:flex-row sm:gap-6"
        >
          <div className="flex -space-x-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-9 w-9 rounded-full border-2 border-[#0b0b0b] bg-gradient-to-br from-[#d7ff53] via-[#5e8bff] to-[#ff5edb]"
                style={{ animation: `spin-slow ${20 + i * 4}s linear infinite` }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1 text-[#d7ff53]">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-4 w-4 fill-current" />
            ))}
            <span className="ml-2 text-xs font-black uppercase tracking-[0.2em] text-white/70">
              2.4k+ Happy Customers
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
