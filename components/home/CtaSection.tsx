"use client";

import Link from "next/link";
import { ShoppingBag, ShieldCheck, Package, ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import { useT } from "../LocaleProvider";

export default function CtaSection() {
  const t = useT();

  return (
    <section
      id="cta"
      data-section-nav
      className="relative overflow-hidden border-t border-white/5 px-4 sm:px-6 py-16 sm:py-24 md:px-8 md:py-32 bg-[#0b0b0b]"
    >
      <div className="mx-auto max-w-7xl relative z-10">
        {/* Simple header */}
        <Reveal className="text-center mb-16">
          <h2 className="text-3xl font-black leading-[1.05] tracking-tight text-white md:text-5xl">
            {t.home.cta.title}
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-sm text-white/70 md:text-base">
            {t.home.cta.subtitle}
          </p>
        </Reveal>

        {/* Main content grid — simple layout, no heavy bg box */}
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-start">
          {/* Left: Trust & features list */}
          <Reveal variant="blur-in" delay={0.1}>
            <div className="space-y-6">
              {/* Feature item */}
              <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-black/30 transition-all duration-300">
                <ShoppingBag className="h-6 w-6 text-[#d7ff53] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-white">Exclusive Marketplace</h3>
                  <p className="text-sm text-white/65 mt-1">Official WALI merchandise direct from the source. Limited drops, authentic quality.</p>
                </div>
              </div>

              {/* Feature item */}
              <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-black/30 transition-all duration-300">
                <ShieldCheck className="h-6 w-6 text-[#d7ff53] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-white">Verified Authentic</h3>
                  <p className="text-sm text-white/65 mt-1">Every product is officially licensed by WALI. No fakes, just real stage culture.</p>
                </div>
              </div>

              {/* Feature item */}
              <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-black/30 transition-all duration-300">
                <Package className="h-6 w-6 text-[#d7ff53] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-white">Fast Worldwide Shipping</h3>
                  <p className="text-sm text-white/65 mt-1">Get your merch fast. Express shipping available to major cities across Indonesia and beyond.</p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right: CTA buttons */}
          <Reveal variant="blur-in" delay={0.2}>
            <div className="space-y-4">
              {/* Primary CTA button — minimal style */}
              <Link
                href="/products"
                className="block w-full group relative overflow-hidden rounded-full bg-[#1a1a11] border border-[#d7ff53]/30 px-6 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-black uppercase tracking-wider text-[#d7ff53] transition-all duration-300 hover:bg-[#d7ff53] hover:text-black hover:shadow-[0_0_30px_rgba(215,255,83,0.4)] active:scale-95"
              >
                <span className="relative">{t.home.cta.primary}</span>
                <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-2" />
                {/* Subtle inner line on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/[0.1] transform translate-x-full group/static" />
              </Link>

              {/* Secondary CTA button */}
              <Link
                href="/track-order"
                className="block w-full rounded-full border border-white/20 bg-white/5 px-6 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-black uppercase tracking-wider text-white/85 backdrop-blur transition-all duration-300 hover:border-white/40 hover:bg-white/10 hover:text-white active:scale-95"
              >
                {t.home.cta.secondary}
              </Link>

              {/* Stats strip — minimal inline */}
              <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-between gap-3 text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white/40 border-t border-white/5 pt-4">
                <span>2,400+ Members</span>
                <span className="border-l border-white/10 px-3">18,000+ Orders</span>
                <span className="border-l border-white/10 px-3">Global Reach</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}