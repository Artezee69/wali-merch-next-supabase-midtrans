"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/lib/banners";

type Props = {
  banners: Banner[];
  autoRotateMs?: number;
  fillHeight?: boolean;
  className?: string;
};

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

  // Touch handling for swipe
  const touchStart = useRef(0);
  const touchEnd = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.touches[0].clientX;
  };

  const onTouchEnd = () => {
    const diff = touchStart.current - touchEnd.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goTo(1);
      else goTo(-1);
    }
  };

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

  // Auto-rotate
  useEffect(() => {
    if (count <= 1) return;
    if (hovered) return;
    if (typeof window !== "undefined") {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;
    }
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
      className={`${className} relative overflow-hidden rounded-xl sm:rounded-2xl`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
    >
      <div
        ref={containerRef}
        className="flex w-full snap-x snap-mandatory overflow-x-hidden h-full"
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

      {/* Arrow controls - hidden on small mobile */}
      {validBanners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(-1)}
            aria-label="Slide sebelumnya"
            className="hidden sm:absolute sm:left-3 sm:top-1/2 sm:z-10 sm:-translate-y-1/2 sm:rounded-full sm:border sm:border-white/15 sm:bg-gray-900/40 sm:p-2 sm:text-white/85 sm:backdrop-blur sm:transition sm:hover:border-[#d7ff53] sm:hover:text-[#d7ff53] dark:bg-gray-800/40"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => goTo(1)}
            aria-label="Slide berikutnya"
            className="hidden sm:absolute sm:right-3 sm:top-1/2 sm:z-10 sm:-translate-y-1/2 sm:rounded-full sm:border sm:border-white/15 sm:bg-gray-900/40 sm:p-2 sm:text-white/85 sm:backdrop-blur sm:transition sm:hover:border-[#d7ff53] sm:hover:text-[#d7ff53] dark:bg-gray-800/40"
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Dots */}
      {validBanners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 sm:bottom-4 sm:gap-2">
          {validBanners.map((b, i) => (
            <button
              key={`dot-${b.id}`}
              type="button"
              onClick={() => {
                setActiveIndex(i);
                scrollToIndex(i);
              }}
              aria-label={`Pergi ke slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "h-2 w-6 bg-[#d7ff53]"
                  : "h-2 w-2 bg-white/40 hover:bg-white/60"
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
  const Cta = banner.button_link ? "a" : "div";
  const ctaProps = banner.button_link
    ? { href: banner.button_link, onClick: (e: React.MouseEvent) => e.preventDefault() }
    : ({} as { href?: string });

  const sizeClass = fillHeight
    ? "relative h-full w-full"
    : "relative w-full";

  return (
    <div className={`${sizeClass} overflow-hidden bg-gray-900`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.image_url}
        alt={banner.title}
        className={`${fillHeight ? "h-full w-full" : "h-[280px] sm:h-[380px] md:h-[480px] lg:h-[560px]"} w-full object-cover`}
        draggable={false}
      />
      {/* Gradient overlay */}
      {showOverlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent dark:from-gray-950/90 dark:via-gray-900/40" />
      )}
      {showOverlay && (
        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-8 sm:px-8 sm:pb-12 md:px-12 md:pb-16">
          <div className="mx-auto max-w-2xl">
            {banner.title && (
              <h2 className="text-xl font-black uppercase tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl leading-tight">
                {banner.title}
              </h2>
            )}
            {banner.subtitle && (
              <p className="mt-2 max-w-xl text-xs text-white/80 sm:text-sm md:text-base">
                {banner.subtitle}
              </p>
            )}
            {banner.button_text && (
              <div className="mt-4 sm:mt-6">
                <Cta
                  {...ctaProps}
                  className="inline-flex items-center gap-2 rounded-full bg-[#d7ff53] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black transition hover:bg-[#c7ef33] active:scale-95"
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
