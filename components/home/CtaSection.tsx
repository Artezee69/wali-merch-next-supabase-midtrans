"use client";

import Link from "next/link";
import { ShoppingBag, ShieldCheck, Package, ArrowRight, Zap, Globe2, BadgeCheck } from "lucide-react";
import Reveal from "./Reveal";
import { useT } from "../LocaleProvider";

const trustItems = [
  {
    icon: ShoppingBag,
    title: "Marketplace Eksklusif",
    desc: "Merchandise resmi WALI langsung dari sumbernya. Drop terbatas, kualitas asli.",
  },
  {
    icon: ShieldCheck,
    title: "100% Original",
    desc: "Semua produk berlisensi resmi dari WALI. Tanpa barang palsu, hanya budaya panggung yang nyata.",
  },
  {
    icon: Package,
    title: "Pengiriman Cepat",
    desc: "Dipacking 1×24 jam, dikirim via JNE/J&T. Pengiriman ekspres tersedia ke kota-kota besar.",
  },
];

export default function CtaSection() {
  const t = useT();

  return (
    <section
      id="cta"
      data-section-nav
      className="relative overflow-hidden border-t border-white/[0.06] bg-black py-20 sm:py-28 md:py-36"
    >
      {/* Radial accent */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[900px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(215,255,83,0.06),transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        {/* Header */}
        <Reveal className="mb-14 text-center sm:mb-16">
          <h2 className="mx-auto max-w-3xl text-balance text-3xl font-black leading-[1.02] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
            {t.home.cta.title}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-sm text-white/50 sm:text-base">
            {t.home.cta.subtitle}
          </p>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-2 md:items-start md:gap-10 lg:gap-14">
          {/* Left: trust cards */}
          <div className="flex flex-col gap-4 sm:gap-5">
            {trustItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} variant="blur-in" delay={0.1 + i * 0.08}>
                  <div className="group flex items-start gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-sm transition-all duration-300 hover:border-[#d7ff53]/25 hover:bg-white/[0.06] sm:p-6">
                    <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-white/10 bg-black/40 transition-all duration-300 group-hover:border-[#d7ff53]/40 group-hover:bg-[#d7ff53]/10">
                      <Icon className="h-5 w-5 text-[#d7ff53]" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-white sm:text-base">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-white/50 sm:text-sm sm:text-white/55">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Right: CTA buttons */}
          <Reveal variant="blur-in" delay={0.2} className="md:sticky md:top-24">
            <div className="flex flex-col gap-5">
              {/* Primary CTA */}
              <Link
                href="/products"
                className="group flex w-full items-center justify-between overflow-hidden rounded-2xl bg-[#d7ff53] px-6 py-5 text-sm font-black uppercase tracking-[0.15em] text-black transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_48px_rgba(215,255,83,0.45)] active:scale-[0.98] sm:px-8 sm:py-6 sm:text-base"
              >
                <span>{t.home.cta.primary}</span>
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>

              {/* Secondary */}
              <Link
                href="/track-order"
                className="flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/[0.04] px-6 py-5 text-sm font-black uppercase tracking-[0.15em] text-white/80 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-white/[0.08] hover:text-white active:scale-[0.98] sm:px-8 sm:py-6 sm:text-base"
              >
                <span>{t.home.cta.secondary}</span>
                <ArrowRight className="h-5 w-5 text-white/40 transition-all duration-300 group-hover:translate-x-1.5" />
              </Link>

              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-4 text-center sm:px-4 sm:py-5">
                  <div className="flex items-center justify-center gap-1.5 text-[#d7ff53]">
                    <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <p className="mt-2 text-base font-black text-white sm:text-xl">2,400+</p>
                  <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white/40 sm:text-[10px]">
                    Member
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-4 text-center sm:px-4 sm:py-5">
                  <div className="flex items-center justify-center gap-1.5 text-[#d7ff53]">
                    <BadgeCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <p className="mt-2 text-base font-black text-white sm:text-xl">18.000+</p>
                  <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white/40 sm:text-[10px]">
                    Pesanan
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-4 text-center sm:px-4 sm:py-5">
                  <div className="flex items-center justify-center gap-1.5 text-[#d7ff53]">
                    <Globe2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <p className="mt-2 text-base font-black text-white sm:text-xl">Global</p>
                  <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white/40 sm:text-[10px]">
                    Jangkauan
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
