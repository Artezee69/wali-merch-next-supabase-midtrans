"use client";

import Link from "next/link";
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
      className="relative overflow-hidden bg-black py-20 sm:py-28 md:py-36"
    >
      {/* Subtle radial accent */}
      <div className="pointer-events-none absolute right-0 top-0 h-[420px] w-[560px] bg-[radial-gradient(circle_at_top_right,rgba(215,255,83,0.05),transparent_60%)]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
        {/* Header */}
        <Reveal className="mb-14 text-center sm:mb-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#d7ff53] backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            {t.home.howToOrder.badge}
          </span>
          <h2 className="mx-auto mt-6 max-w-2xl text-balance text-2xl font-black leading-[1.05] tracking-tight text-white sm:text-3xl md:mt-7 md:text-4xl lg:text-5xl">
            {t.home.howToOrder.title}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-balance text-sm text-white/50 sm:text-base">
            {t.home.howToOrder.subtitle}
          </p>
        </Reveal>

        {/* Step cards — 2x2 grid on desktop, 1 column on mobile */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:gap-6">
          {steps.map((step, i) => {
            const Icon = icons[i];
            return (
              <Reveal key={step.title} variant="blur-in" delay={i * 0.08}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#d7ff53]/30 hover:bg-white/[0.06] sm:p-7">
                  {/* Watermark number */}
                  <span className="pointer-events-none absolute -right-3 -top-5 text-[88px] font-black leading-none text-white/[0.04] transition-colors duration-300 group-hover:text-[#d7ff53]/[0.07] sm:text-[104px]">
                    0{i + 1}
                  </span>

                  <div className="relative flex items-start gap-4">
                    {/* Icon in glass circle */}
                    <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-white/10 bg-black/40 transition-all duration-300 group-hover:border-[#d7ff53]/40 group-hover:bg-[#d7ff53]/10">
                      <Icon className="h-5 w-5 text-[#d7ff53]" strokeWidth={1.5} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-black text-white sm:text-lg">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-white/50 sm:text-sm sm:text-white/55">
                        {step.desc}
                      </p>
                      <div className="mt-4">
                        <span className="inline-block rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-white/40 sm:text-[10px]">
                          {step.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* CTA */}
        <Reveal variant="blur-in" delay={0.35} className="mt-14 text-center sm:mt-16">
          <Link
            href="/products"
            className="group inline-flex items-center gap-2.5 rounded-full bg-[#d7ff53] px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(215,255,83,0.4)] active:scale-95 sm:px-10"
          >
            Mulai Belanja
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
