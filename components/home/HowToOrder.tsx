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
      className="relative overflow-hidden px-4 py-24 md:px-8 md:py-32 bg-[#0b0b0b]"
    >
      <div className="mx-auto max-w-6xl relative z-10">
        <Reveal className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 bg-black/20 border border-white/10 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.3em] text-[#d7ff53]">
            <Sparkles className="h-3 w-3" />
            {t.home.howToOrder.badge}
          </span>
          <h2 className="mx-auto mt-6 text-2xl md:text-4xl font-black leading-[1.1] tracking-tight text-white">
            {t.home.howToOrder.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm md:text-base text-white/65">
            {t.home.howToOrder.subtitle}
          </p>
        </Reveal>

        <div className="relative mt-20">
          <div className="absolute left-0 right-0 top-8 h-0.5 bg-white/5" />

          <div className="relative flex items-start justify-between pl-8 pr-8 pt-8">
            {steps.map((step, i) => {
              const Icon = icons[i];
              const isLast = i === steps.length - 1;

              return (
                <div
                  key={step.title}
                  className={`group relative flex-1 flex flex-col items-center ${
                    i !== steps.length - 1 ? "mr-8" : ""
                  }`}
                >
                  <div className="mb-3">
                    <span className="text-xs font-black text-white/40 tracking-wide group-hover:text-[#d7ff53] transition-colors duration-300">
                      0{String(i + 1)}
                    </span>
                  </div>

                  <div className="mb-4">
                    <Icon
                      className="h-10 w-10 text-white/60 transition-colors duration-300 group-hover:text-[#d7ff53]"
                      strokeWidth={1.5}
                    />
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-[#d7ff53] transition-colors duration-300 text-center">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-sm text-white/70 text-center leading-relaxed max-w-[200px]">
                    {step.desc}
                  </p>

                  <div className="mt-4">
                    <span className="text-xs font-black uppercase tracking-wide text-white/50 bg-black/30 border border-white/5 px-3 py-1 rounded-full">
                      {step.time}
                    </span>
                  </div>

                  {!isLast && (
                    <div className="absolute left-1/2 top-full w-0.5 h-12 bg-white/5 -translate-x-1/2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Reveal variant="blur-in" delay={0.4} className="mt-24 text-center">
          <div className="inline-flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/50 hover:text-white hover:[#d7ff53] transition-colors duration-300">
            Status: Live & accepting orders
            <ArrowRight className="h-3.5 w-3.5 text-[#d7ff53] transition-transform duration-300 group-hover:translate-x-1"></ArrowRight>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
