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
      className="relative overflow-hidden px-4 sm:px-6 py-16 sm:py-24 md:px-8 md:py-32 bg-[#0b0b0b]"
    >
      <div className="mx-auto max-w-6xl relative z-10">
        <Reveal className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 bg-black/20 border border-white/10 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.3em] text-[#d7ff53]">
            <Sparkles className="h-3 w-3" />
            {t.home.howToOrder.badge}
          </span>
          <h2 className="mx-auto mt-6 text-xl sm:text-2xl md:text-4xl font-black leading-[1.1] tracking-tight text-white">
            {t.home.howToOrder.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm md:text-base text-white/65">
            {t.home.howToOrder.subtitle}
          </p>
        </Reveal>

        <div className="relative mt-12 sm:mt-20">
          {/* Desktop horizontal line */}
          <div className="hidden sm:block absolute left-0 right-0 top-10 h-0.5 bg-white/10" />

          {/* Mobile vertical line */}
          <div className="sm:hidden absolute left-8 top-0 bottom-0 w-0.5 bg-white/10" />

          <div className="relative flex flex-col sm:flex sm:items-start">
            {steps.map((step, i) => {
              const Icon = icons[i];
              const isLast = i === steps.length - 1;

              return (
                <div
                  key={step.title}
                  className={`group relative flex items-start sm:items-stretch ${
                    !isLast ? "sm:mr-8 mb-10 sm:mb-0" : ""
                  }`}
                >
                  {/* Number badge - Desktop */}
                  <div className="hidden sm:flex flex-col items-center mr-6">
                    <span className="text-xs font-black text-white/40 tracking-wide group-hover:text-[#d7ff53] transition-colors duration-300 mb-3">
                      0{String(i + 1)}
                    </span>
                    {!isLast && (
                      <div className="w-0.5 h-full bg-white/10" />
                    )}
                  </div>

                  {/* Number badge - Mobile */}
                  <div className="sm:hidden absolute left-0 flex items-center justify-center w-16 h-16 rounded-full bg-black/50 border border-white/10 group-hover:border-[#d7ff53]/50 transition-colors duration-300 z-10">
                    <span className="text-xs font-black text-[#d7ff53]">
                      0{String(i + 1)}
                    </span>
                  </div>

                  {/* Content card */}
                  <div className="flex-1 pl-20 sm:pl-0 sm:pt-4">
                    {/* Icon */}
                    <div className="mb-4">
                      <Icon
                        className="h-10 w-10 text-white/60 transition-colors duration-300 group-hover:text-[#d7ff53]"
                        strokeWidth={1.5}
                      />
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#d7ff53] transition-colors duration-300">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="mt-2 text-sm text-white/70 leading-relaxed">
                      {step.desc}
                    </p>

                    {/* Time badge */}
                    <div className="mt-4">
                      <span className="text-xs font-black uppercase tracking-wide text-white/50 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                        {step.time}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Reveal variant="blur-in" delay={0.4} className="mt-16 sm:mt-24 text-center">
          <div className="inline-flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/50 hover:text-white hover:[#d7ff53] transition-colors duration-300">
            Status: Live & accepting orders
            <ArrowRight className="h-3.5 w-3.5 text-[#d7ff53] transition-transform duration-300 group-hover:translate-x-1"></ArrowRight>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
