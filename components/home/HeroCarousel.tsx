"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/lib/banner-types";
import { bannerObjectPosition } from "@/lib/banner-types";

type Props = {
  banners: Banner[];
  autoRotateMs?: number;
  /** When true, slide fills parent height instead of using aspect-ratio.
   *  Used when hero sits in a grid alongside promo banners that define the height. */
  fillHeight?: boolean;
  className?: string;
};

/**
 * Hero carousel berbasis CSS scroll-snap.
 * - Tanpa dependensi tambahan (tidak pakai embla/swiper).
 * - Auto-rotate setiap `autoRotateMs` (default 6000).
 * - Pause auto-rotate saat hover.
 * - Menghormati prefers-reduced-motion (no autoplay).
 */
export default function HeroCarousel({ banners, autoRotateMs = 6000, fillHeight = false, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState(false);

  const count = banners.length;
  const validBanners = useMemo(
    () => banners.filter((b) => b.image_url),
    [banners]
  );

  const scrollToIndex = useCallback(
    (i: number) => {
      const el = containerRef.current;
      if (!el) return;
      const child = el.children[i] as HTMLElement | undefined;
      if (!child) return;
      el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
    },
    []
  );

  const goTo = useCallback(
    (delta: number) => {
      if (count === 0) return;
      const next = (activeIndex + delta + count) % count;
      setActiveIndex(next);
      scrollToIndex(next);
    },
    [activeIndex, count, scrollToIndex]
  );

  // Track active slide via scroll position
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      const slideWidth = el.clientWidth;
      if (slideWidth === 0) return;
      const idx = Math.round(el.scrollLeft / slideWidth);
      setActiveIndex(Math.min(count - 1, Math.max(0, idx)));
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [count]);

  // Auto-rotate — disabled on mobile (saves CPU/GPU) and reduced-motion
  useEffect(() => {
    if (count <= 1) return;
    if (hovered) return;
    if (typeof window === "undefined") return;
    // Skip auto-rotate on mobile (viewpoint < 768px)
    if (window.innerWidth < 768) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % count;
        scrollToIndex(next);
        return next;
      });
    }, autoRotateMs);
    return () => window.clearInterval(id);
  }, [count, hovered, autoRotateMs, scrollToIndex]);

  if (validBanners.length === 0) {
    return null;
  }

  return (
    <div
      className={`${className} relative w-full`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-roledescription="carousel"
    >
      <div
        ref={containerRef}
        className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto touch-pan-x"
        style={{ scrollBehavior: "smooth" }}
      >
        {validBanners.map((b, i) => (
          <div
            key={b.id}
            className="relative w-full shrink-0 snap-center"
            aria-roledescription="slide"
            aria-label={`${i + 1} dari ${validBanners.length}`}
          >
            <BannerSlide banner={b} fillHeight={fillHeight} />
          </div>
        ))}
      </div>

      {/* Bottom fade for text readability — taller on mobile for larger text */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-48 sm:h-56 md:h-64" />

      {/* Arrow controls — smaller on mobile, comfortable tap targets */}
      {validBanners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(-1)}
            aria-label="Slide sebelumnya"
            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-[#d7ff53] hover:bg-[#d7ff53] hover:text-black active:scale-95 sm:left-6 sm:h-12 sm:w-12"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => goTo(1)}
            aria-label="Slide berikutnya"
            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-[#d7ff53] hover:bg-[#d7ff53] hover:text-black active:scale-95 sm:right-6 sm:h-12 sm:w-12"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Dots — more spacing on mobile so they don't get hidden behind text */}
      {validBanners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 sm:bottom-8 sm:gap-2.5">
          {validBanners.map((b, i) => (
            <button
              key={`dot-${b.id}`}
              type="button"
              onClick={() => {
                setActiveIndex(i);
                scrollToIndex(i);
              }}
              aria-label={`Pergi ke slide ${i + 1}`}
              className={`rounded-full transition-all duration-400 ease-out ${
                i === activeIndex
                  ? "h-2 w-8 bg-[#d7ff53]"
                  : "h-2 w-2 bg-white/40 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BannerSlide({ banner, fillHeight = false }: { banner: Banner; fillHeight?: boolean }) {
  const hasText = !!(banner.title || banner.subtitle || banner.button_text);
  const showOverlay = hasText && !banner.hide_overlay;
  const Cta = banner.button_link ? Link : "div";
  const ctaProps = banner.button_link
    ? { href: banner.button_link }
    : ({} as { href?: string });

  const sizeClass = fillHeight
    ? "relative h-full w-full"
    : "relative aspect-[16/9] w-full sm:aspect-[16/7] md:aspect-[21/9]";

  return (
    <div className={`${sizeClass} overflow-hidden bg-black`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.image_url}
        alt={banner.title}
        loading={fillHeight ? "eager" : "lazy"}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: bannerObjectPosition(banner.focus_point ?? "center") }}
        draggable={false}
      />
      {/* Dark vignette — strongest behind the text block */}
      {showOverlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/10" />
      )}
      {showOverlay && (
        <div
          className="absolute inset-x-0 bottom-0 z-10 px-4 pb-8 sm:px-6 sm:pb-12 md:px-10 md:pb-14 lg:px-12 lg:pb-16"
        >
          <div className="mx-auto w-full max-w-3xl">
            {banner.title && (
              <h2 className="text-[1.75rem] font-black uppercase leading-[1.05] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                {banner.title}
              </h2>
            )}
            {banner.subtitle && (
              <p className="mt-2 max-w-xl text-[0.8rem] leading-snug text-white/75 sm:mt-3 sm:text-sm md:mt-4 md:text-base lg:text-lg">
                {banner.subtitle}
              </p>
            )}
            {banner.button_text && (
              <div className="mt-5 sm:mt-6 md:mt-7">
                {/* @ts-expect-error - dynamic tag with conditional props */}
                <Cta
                  {...ctaProps}
                  className="inline-flex items-center gap-2 rounded-full bg-[#d7ff53] px-5 py-3 text-[0.65rem] font-black uppercase tracking-[0.14em] text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_36px_rgba(215,255,83,0.5)] sm:px-7 sm:py-3.5 sm:text-xs md:px-8 md:py-4 md:text-sm"
                >
                  {banner.button_text}
                </Cta>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
