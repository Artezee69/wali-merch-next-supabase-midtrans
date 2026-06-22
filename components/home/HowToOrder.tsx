"use client";

import { Search, Ruler, CreditCard, PackageCheck, ArrowRight, Sparkles } from "lucide-react";
import Reveal from "./Reveal";
import { useT } from "../LocaleProvider";

const icons = [Search, Ruler, CreditCard, PackageCheck];

export default function HowToOrder() {
  const t = useT();
  const steps = t.home.howToOrder.steps;
  return (
    <section
      id="how-to-order"
      data-section-nav
      className="relative overflow-hidden border-t border-white/5 px-4 py-24 md:px-8 md:py-32"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(94,139,255,0.08),transparent_70%)] blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <Reveal className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#5e8bff]/20 bg-[#5e8bff]/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#5e8bff]">
            <Sparkles className="h-3 w-3" />
            {t.home.howToOrder.badge}
          </span>
          <h2 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-black leading-[1.05] tracking-tight text-white md:text-6xl">
            {t.home.howToOrder.title}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-sm text-white/55 md:text-base">
            {t.home.howToOrder.subtitle}
          </p>
        </Reveal>

        {/* Steps grid */}
        <div className="relative mt-16">
          {/* Connecting line — desktop only */}
          <div className="pointer-events-none absolute left-1/2 top-12 hidden h-px w-[calc(100%-12rem)] -translate-x-1/2 lg:block">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div
              className="absolute inset-0 h-full w-full animate-flow-line"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, transparent 0%, rgba(215,255,83,0.6) 50%, transparent 100%)",
                backgroundSize: "50% 100%",
                backgroundRepeat: "no-repeat",
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-4">
            {steps.map((step, i) => {
              const Icon = icons[i];
              return (
                <Reveal
                  key={step.title}
                  variant="scale-in"
                  delay={i * 0.08}
                  className="group relative"
                >
                  <div className="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 transition-all duration-500 hover:border-[#d7ff53]/30 hover:from-white/[0.06] hover:to-white/[0.02]">
                    {/* Halo glow on hover */}
                    <div className="absolute -top-12 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(215,255,83,0.2),transparent_70%)] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="relative z-10 flex items-start justify-between">
                      <div className="relative">
                        <div className="absolute inset-0 -m-3 rounded-full border border-[#d7ff53]/20 transition-all duration-700 group-hover:rotate-180 group-hover:scale-110" />
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] text-[#d7ff53] transition-transform duration-500 group-hover:scale-105">
                          <Icon className="h-7 w-7" strokeWidth={2.2} />
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-3xl font-black leading-none text-white/10 transition-colors duration-500 group-hover:text-[#d7ff53]/30">
                          0{i + 1}
                        </span>
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/50">
                          {step.time}
                        </span>
                      </div>
                    </div>

                    <h3 className="relative z-10 mt-6 text-lg font-black text-white">
                      {step.title}
                    </h3>
                    <p className="relative z-10 mt-2 text-xs leading-relaxed text-white/55 md:text-sm">
                      {step.desc}
                    </p>

                    {/* Bottom progress line */}
                    <div className="relative z-10 mt-6 h-px w-full bg-white/5">
                      <div className="absolute inset-y-0 left-0 w-0 bg-gradient-to-r from-[#d7ff53] to-transparent transition-all duration-700 group-hover:w-full" />
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <Reveal variant="blur-in" delay={0.4} className="mt-12 text-center">
          <div className="relative inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3">
            <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#d7ff53]">
              <div className="absolute inset-0 animate-ping rounded-full bg-[#d7ff53]/60" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white/60">
              Status: Live & accepting orders
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-[#d7ff53]" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
