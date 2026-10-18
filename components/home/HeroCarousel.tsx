"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/lib/banners";

type Props = {
  banners: Banner[];
  autoRotateMs?: number;
  /** When true, slide fills parent height instead of using aspect-ratio.
   *  Used when hero sits in a grid alongside promo banners that define the height. */
  fillHeight?: boolean;
  className?: string;
};

/**
 * Hero carousel sederhana berbasis CSS scroll-snap.
 * - Tidak butuh dependensi tambahan (tidak pakai embla/swiper).
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
      className={`${className} relative ${fillHeight ? "h-full" : ""} w-full`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-roledescription="carousel"
    >
      <div
        ref={containerRef}
        className="flex w-full snap-x snap-mandatory overflow-x-hidden h-full touch-pan-x"
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

      {/* Arrow controls */}
      {validBanners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(-1)}
            aria-label="Slide sebelumnya"
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-gray-900/60 p-2.5 text-white/90 backdrop-blur-md transition-all duration-300 hover:border-[#d7ff53] hover:bg-[#d7ff53]/20 hover:text-[#d7ff53] dark:bg-gray-800/60 active:scale-90 hidden sm:flex"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => goTo(1)}
            aria-label="Slide berikutnya"
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-gray-900/60 p-2.5 text-white/90 backdrop-blur-md transition-all duration-300 hover:border-[#d7ff53] hover:bg-[#d7ff53]/20 hover:text-[#d7ff53] dark:bg-gray-800/60 active:scale-90 hidden sm:flex"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Dots */}
      {validBanners.length > 1 && (
        <div className="pointer-events-auto absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-4">
          {validBanners.map((b, i) => (
            <button
              key={`dot-${b.id}`}
              type="button"
              onClick={() => {
                setActiveIndex(i);
                scrollToIndex(i);
              }}
              aria-label={`Pergi ke slide ${i + 1}`}
              className={`transition-all duration-300 ease-out ${
                i === activeIndex
                  ? "h-2 w-8 rounded-full bg-[#d7ff53] shadow-[0_0_10px_rgba(215,255,83,0.5)]"
                  : "h-2 w-2 rounded-full bg-white/40 hover:bg-white/70"
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
    : "relative aspect-[16/9] sm:aspect-[16/7] md:aspect-[16/6] w-full";

  return (
    <div className={`${sizeClass} overflow-hidden bg-gray-900 dark:bg-gray-950`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.image_url}
        alt={banner.title}
        loading={fillHeight ? "eager" : "lazy"}
        decoding="async"
        className={`absolute inset-0 ${fillHeight ? "h-full w-full object-cover" : "object-cover"}`}
        draggable={false}
      />
      {/* Gradient overlay for text readability — lighter on mobile */}
      {showOverlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent sm:from-black/85 sm:via-black/30 dark:from-gray-950/85 dark:via-gray-900/30" />
      )}
      {showOverlay && (
        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-10 sm:px-8 sm:pb-14 md:px-12 md:pb-16">
          <div className="mx-auto max-w-2xl sm:max-w-3xl">
            {banner.title && (
              <h2 className="text-xl font-black uppercase tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl leading-[1.05]">
                {banner.title}
              </h2>
            )}
            {banner.subtitle && (
              <p className="mt-2 max-w-xl text-xs text-white/75 sm:text-sm md:text-base leading-relaxed">
                {banner.subtitle}
              </p>
            )}
            {banner.button_text && (
              <div className="mt-4 sm:mt-5">
                {/* @ts-expect-error - dynamic tag with conditional props */}
                <Cta
                  {...ctaProps}
                  className="inline-flex items-center gap-2 rounded-full bg-[#d7ff53] px-5 py-3 text-xs font-black uppercase tracking-wider text-black transition-all duration-300 hover:bg-[#c7ef33] hover:shadow-lg hover:shadow-[#d7ff53]/30 active:scale-95"
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
