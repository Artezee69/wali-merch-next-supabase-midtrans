"use client";

import { useState } from "react";
import { ChevronDown, MessageCircle, Sparkles } from "lucide-react";
import Reveal from "./Reveal";
import { useT } from "../LocaleProvider";

export default function Faq() {
  const t = useT();
  const items = t.home.faq.items;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      data-section-nav
      className="relative overflow-hidden border-t border-white/[0.06] bg-black py-20 sm:py-28 md:py-36"
    >
      {/* Subtle radial accent */}
      <div className="pointer-events-none absolute left-0 top-0 h-[360px] w-[560px] bg-[radial-gradient(circle_at_top_left,rgba(215,255,83,0.05),transparent_60%)]" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        {/* Header */}
        <Reveal className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-white/60 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-[#d7ff53]" />
            {t.home.faq.badge}
          </span>
          <h2 className="mx-auto mt-7 max-w-2xl text-balance text-2xl font-black leading-[1.05] tracking-tight text-white sm:text-3xl md:text-4xl">
            {t.home.faq.title}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-balance text-sm text-white/50 sm:text-base">
            {t.home.faq.subtitle}
          </p>
        </Reveal>

        {/* Accordion */}
        <div className="mt-12 space-y-3 sm:mt-14">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} variant="blur-in" delay={i * 0.05}>
                <div
                  className={`overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                    isOpen
                      ? "border-[#d7ff53]/25 bg-white/[0.04]"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6 sm:py-6"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <span
                        className={`text-[11px] font-black tabular-nums transition-colors duration-300 ${
                          isOpen ? "text-[#d7ff53]" : "text-white/25"
                        }`}
                      >
                        0{i + 1}
                      </span>
                      <span
                        className={`min-w-0 text-sm font-bold transition-colors duration-300 ${
                          isOpen ? "text-white" : "text-white/75"
                        }`}
                      >
                        {item.q}
                      </span>
                    </div>
                    <div
                      className={`flex h-9 w-9 flex-none items-center justify-center rounded-full border transition-all duration-300 ${
                        isOpen
                          ? "rotate-180 border-[#d7ff53]/40 bg-[#d7ff53]/10"
                          : "border-white/10 bg-white/[0.04]"
                      }`}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-colors duration-300 ${
                          isOpen ? "text-[#d7ff53]" : "text-white/50"
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    className="grid transition-all duration-300"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 pl-11 text-xs leading-relaxed text-white/55 sm:px-6 sm:pb-6 sm:pl-[3.25rem] sm:text-sm">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <Reveal variant="blur-in" delay={0.4} className="mt-12 text-center sm:mt-14">
          <a
            href="https://wa.me/6285134894580"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-7 py-4 text-xs font-black uppercase tracking-[0.2em] text-white/70 backdrop-blur-sm transition-all duration-300 hover:border-[#d7ff53]/40 hover:bg-[#d7ff53]/10 hover:text-white active:scale-95"
          >
            <MessageCircle className="h-4 w-4 text-[#d7ff53]" />
            Tanya langsung via WhatsApp
          </a>
        </Reveal>
      </div>
    </section>
  );
}
