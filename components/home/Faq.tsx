"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle, Sparkles } from "lucide-react";
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
      className="relative overflow-hidden border-t border-white/5 px-4 sm:px-6 py-16 sm:py-24 md:px-8 md:py-32"
    >
      {/* Ambient layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(215,255,83,0.06),transparent_70%)] blur-3xl" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(94,139,255,0.06),transparent_70%)] blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <Reveal className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-white/80">
            <HelpCircle className="h-3 w-3" />
            {t.home.faq.badge}
          </span>
          <h2 className="mx-auto mt-6 max-w-2xl text-balance text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-[1.05] tracking-tight text-white">
            {t.home.faq.title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-balance text-sm text-white/55 md:text-base">
            {t.home.faq.subtitle}
          </p>
        </Reveal>

        {/* FAQ list */}
        <div className="mt-12 space-y-3">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} variant="blur-in" delay={i * 0.04}>
                <div
                  className={`group relative overflow-hidden rounded-2xl border transition-all duration-500 ${
                    isOpen
                      ? "border-[#d7ff53]/30 bg-gradient-to-b from-white/[0.05] to-white/[0.01] shadow-[0_0_30px_-15px_rgba(215,255,83,0.4)]"
                      : "border-white/10 bg-black/30 hover:border-white/20"
                  }`}
                >
                  {/* Open glow */}
                  {isOpen ? (
                    <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(215,255,83,0.08),transparent_60%)]" />
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-3 sm:gap-4 px-4 sm:px-5 py-4 sm:py-5 text-left"
                  >
                    <div className="flex flex-1 items-center gap-4">
                      <span
                        className={`text-[10px] font-black tabular-nums transition-colors duration-500 ${
                          isOpen ? "text-[#d7ff53]" : "text-white/30"
                        }`}
                      >
                        0{i + 1}
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-black transition-colors duration-500 ${
                          isOpen ? "text-white" : "text-white/85"
                        }`}
                      >
                        {item.q}
                      </span>
                    </div>
                    <div
                      className={`relative flex h-9 w-9 flex-none items-center justify-center rounded-full border transition-all duration-500 ${
                        isOpen
                          ? "border-[#d7ff53]/40 bg-[#d7ff53]/15"
                          : "border-white/15 bg-black/50"
                      }`}
                    >
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-[#d7ff53]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-white/70" />
                      )}
                    </div>
                  </button>

                  <div
                    className="grid transition-all duration-500"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="overflow-hidden">
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pl-10 sm:pl-12">
                        <div className="h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
                        <p className="mt-3 sm:mt-4 text-xs sm:text-sm leading-relaxed text-white/60">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <Reveal variant="blur-in" delay={0.4} className="mt-12 text-center">
          <a
            href="https://wa.me/6285134894580"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white/70 transition-all duration-500 hover:border-[#d7ff53]/40 hover:bg-[#d7ff53]/5 hover:text-white"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#d7ff53]" />
            Tanya langsung via WhatsApp
            <MessageCircle className="h-3.5 w-3.5 text-white/40 transition-colors duration-500 group-hover:text-[#d7ff53]" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
