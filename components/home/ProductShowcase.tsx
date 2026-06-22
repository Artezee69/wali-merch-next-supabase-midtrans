"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Eye,
  Pause,
  Play,
} from "lucide-react";
import Reveal from "./Reveal";

type Product = {
  id: string;
  name: string;
  price: number;
  tag?: string;
  category?: string;
  slug?: string;
  description?: string;
  image?: string;
  product_images?: { image_url: string }[];
};

const fallbackProducts: Product[] = [
  {
    id: "fb-1",
    name: "Player Edition Tee",
    price: 199000,
    tag: "Newest Drop",
    slug: "player-edition-tee",
    description: "Sablon DTF premium dengan detail player edition.",
    image:
      "https://images.unsplash.com/photo-1523398002811-999ca8dec234?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "fb-2",
    name: "Regular Logo Tee",
    price: 159000,
    tag: "Essential",
    slug: "regular-logo-tee",
    description: "Logo reguler warna solid, basic essential untuk daily wear.",
    image:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "fb-3",
    name: "Vintage Stage Series",
    price: 0,
    tag: "Limited",
    category: "Coming Soon",
    description: "Coming soon. Pantau terus drop selanjutnya.",
    image:
      "https://images.unsplash.com/photo-1506629905607-d9f297d7fbc4?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "fb-4",
    name: "Stage Hoodie Blackout",
    price: 349000,
    tag: "Player Edition",
    slug: "stage-hoodie-blackout",
    description: "Hoodie heavyweight 400gsm dengan detail bordir punggung.",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "fb-5",
    name: "Tour Cap Snapback",
    price: 129000,
    tag: "Accessories",
    slug: "tour-cap-snapback",
    description: "Topi snapback dengan bordur logo tour resmi.",
    image:
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "fb-6",
    name: "Stage Crew Long Sleeve",
    price: 229000,
    tag: "Stage Crew",
    slug: "stage-crew-long-sleeve",
    description: "Long sleeve dengan print stage crew official.",
    image:
      "https://images.unsplash.com/photo-1622445275576-721325763afe?q=80&w=1200&auto=format&fit=crop",
  },
];

/* ============================================================ */
/*  MAIN COMPONENT — futuristic wardrobe with infinite auto-loop */
/* ============================================================ */

export default function ProductShowcase({
  products,
}: {
  products?: Product[];
}) {
  const baseItems =
    products && products.length > 0 ? products : fallbackProducts;

  const tripled = [...baseItems, ...baseItems, ...baseItems];
  const setSize = baseItems.length;

  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const userInteractingRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [active, setActive] = useState(setSize);
  const [mounted, setMounted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [autoScrollOn, setAutoScrollOn] = useState(true);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setAutoScrollOn(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[setSize] as HTMLElement | undefined;
    if (!child) return;
    const left = child.offsetLeft - track.offsetLeft;
    track.scrollLeft = left;
  }, [setSize, baseItems]);

  const recomputeActive = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    let minDiff = Infinity;
    Array.from(track.children).forEach((c, i) => {
      const el = c as HTMLElement;
      const centerEl = el.offsetLeft - track.offsetLeft + el.offsetWidth / 2;
      const diff = Math.abs(centerEl - center);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    });
    setActive(closest);

    const total = track.scrollWidth - track.clientWidth;
    setProgress(total > 0 ? track.scrollLeft / total : 0);
  }, []);

  const onScroll = () => recomputeActive();

  useEffect(() => {
    if (!autoScrollOn) return;
    const track = trackRef.current;
    if (!track) return;

    const VELOCITY = 28;
    const tick = (now: number) => {
      if (!trackRef.current) return;
      const last = lastTimeRef.current || now;
      const dt = (now - last) / 1000;
      lastTimeRef.current = now;
      if (!paused && !hovering && !userInteractingRef.current) {
        trackRef.current.scrollLeft += VELOCITY * dt;

        const children = Array.from(trackRef.current.children) as HTMLElement[];
        const first = children[0];
        const secondSetStart = children[setSize];
        const thirdSetStart = children[setSize * 2];
        if (first && secondSetStart && thirdSetStart) {
          const setWidth =
            secondSetStart.offsetLeft - first.offsetLeft;
          const thirdStartX = thirdSetStart.offsetLeft - trackRef.current.offsetLeft;
          if (
            trackRef.current.scrollLeft >
            thirdStartX - trackRef.current.clientWidth
          ) {
            trackRef.current.scrollLeft -= setWidth;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
    };
  }, [autoScrollOn, paused, hovering, setSize]);

  const scrollToIndex = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[i] as HTMLElement | undefined;
    if (!child) return;
    const left = child.offsetLeft - track.offsetLeft;
    track.scrollTo({ left, behavior: "smooth" });
  };

  const markInteraction = () => {
    userInteractingRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      userInteractingRef.current = false;
    }, 1800);
  };

  const togglePause = () => setPaused((p) => !p);

  const logicalActive = active % setSize;

  return (
    <section
      id="section-products"
      className="relative overflow-hidden border-y border-white/10 py-24 md:py-32"
    >
      {/* ===== Stage ambient lighting ===== */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[120%] w-[140%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center_top,_rgba(215,255,83,0.20),_transparent_55%)]" />
        <div className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-[#5e8bff]/10 blur-[140px] animate-aurora-2" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-[#ff5edb]/10 blur-[140px] animate-aurora-1" />
        <div className="absolute left-1/4 top-1/2 h-72 w-72 rounded-full bg-[#d7ff53]/8 blur-[120px] animate-aurora-3" />
        <div className="absolute bottom-[180px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="absolute inset-0 bg-grid-fade [background-size:64px_64px] opacity-[0.18]" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0b0b0b] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0b0b0b] to-transparent" />
        {/* Floating ambient particles */}
        <AmbientParticles />
      </div>

      {/* ===== Header ===== */}
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <Reveal>
          <div className="mb-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-[#d7ff53]">
            <span className="h-px w-8 bg-[#d7ff53]" />
            The Wardrobe
            <span className="h-1 w-1 rounded-full bg-[#d7ff53] animate-pulse-soft" />
            <span className="hidden sm:inline">Auto-curated · Loop</span>
          </div>
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h2 className="font-display text-4xl font-black uppercase leading-[0.92] tracking-[-0.03em] md:text-7xl">
                Latest
                <span
                  className="ml-3 inline-block bg-gradient-to-r from-[#d7ff53] via-[#f6ffb8] to-[#d7ff53] bg-clip-text text-transparent [background-size:200%_auto]"
                  style={{ animation: "gradient-x 6s linear infinite" }}
                >
                  Drop
                </span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/55">
                Etalase capsule terbaru. Geser untuk menjelajah — setiap piece
                siap untuk kamu bawa pulang.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 -z-10 rounded-full bg-[#d7ff53]/10 blur-md" />
                <div className="flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 backdrop-blur-md">
                  <span
                    key={logicalActive}
                    className="font-display text-2xl font-black text-[#d7ff53] tabular-nums"
                    style={{ animation: "count-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both" }}
                  >
                    {String(logicalActive + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xs text-white/30">/</span>
                  <span className="font-mono text-sm text-white/50 tabular-nums">
                    {String(setSize).padStart(2, "0")}
                  </span>
                </div>
              </div>
              <button
                onClick={togglePause}
                aria-label={paused ? "Resume auto-scroll" : "Pause auto-scroll"}
                className="magnetic group flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white backdrop-blur-md transition-all duration-300 hover:border-[#d7ff53] hover:bg-[#d7ff53] hover:text-black hover:scale-110"
              >
                {paused ? (
                  <Play className="h-4 w-4 fill-current" />
                ) : (
                  <Pause className="h-4 w-4 fill-current" />
                )}
              </button>
              <div className="hidden gap-2 md:flex">
                <button
                  onClick={() => {
                    markInteraction();
                    scrollToIndex(Math.max(0, active - 1));
                  }}
                  className="magnetic group flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white backdrop-blur-md transition-all duration-300 hover:border-[#d7ff53] hover:bg-[#d7ff53] hover:text-black hover:scale-110"
                  aria-label="Previous product"
                >
                  <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                </button>
                <button
                  onClick={() => {
                    markInteraction();
                    scrollToIndex(Math.min(tripled.length - 1, active + 1));
                  }}
                  className="magnetic group flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white backdrop-blur-md transition-all duration-300 hover:border-[#d7ff53] hover:bg-[#d7ff53] hover:text-black hover:scale-110"
                  aria-label="Next product"
                >
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ===== The RAIL ===== */}
      <div
        className="relative mt-14"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onTouchStart={() => setHovering(true)}
        onTouchEnd={() => setHovering(false)}
        style={{
          opacity: mounted ? 1 : 0,
          transition: "opacity 1000ms ease 400ms",
        }}
      >
        <div className="pointer-events-none absolute left-0 right-0 top-[68px] z-10 hidden h-px bg-gradient-to-r from-transparent via-white/40 to-transparent md:block" />
        <div className="pointer-events-none absolute left-0 right-0 top-[60px] z-10 hidden md:block">
          <div className="mx-auto h-3 max-w-7xl bg-gradient-to-b from-white/[0.06] to-transparent" />
        </div>

        {/* Side fade masks with subtle brand text */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-[#0b0b0b] via-[#0b0b0b]/80 to-transparent md:w-32">
          <div className="flex h-full items-center pl-4">
            <div className="rotate-180 [writing-mode:vertical-rl] text-[9px] font-black uppercase tracking-[0.5em] text-white/15">
              WALI · COLLECTION
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-[#0b0b0b] via-[#0b0b0b]/80 to-transparent md:w-32">
          <div className="flex h-full items-center pl-4">
            <div className="[writing-mode:vertical-rl] text-[9px] font-black uppercase tracking-[0.5em] text-white/15">
              WALI · COLLECTION
            </div>
          </div>
        </div>

        <div
          ref={trackRef}
          onScroll={onScroll}
          onWheel={() => markInteraction()}
          onPointerDown={() => markInteraction()}
          onTouchMove={() => markInteraction()}
          className="no-scrollbar flex gap-5 overflow-x-auto px-4 pb-10 pt-12 md:gap-7 md:px-8"
          style={{
            scrollPaddingLeft: "max(1rem, calc((100vw - 1280px) / 2))",
            scrollBehavior: "auto",
            cursor: hovering && !paused ? "default" : "grab",
          }}
        >
          {tripled.map((product, i) => {
            const isComingSoon =
              product.price === 0 || product.category === "Coming Soon";
            const isActive = active === i;
            return (
              <ProductRackItem
                key={`${product.id}-${i}`}
                product={product}
                isComingSoon={isComingSoon}
                index={i}
                logicalIndex={i % setSize}
                isActive={isActive}
                onUserInteract={markInteraction}
              />
            );
          })}
        </div>

        {/* ===== Bottom rail + dots + progress ===== */}
        <div className="mx-auto mt-2 max-w-7xl px-4 md:px-8">
          <div className="flex items-center gap-4">
            <div className="flex flex-1 items-center gap-1.5">
              {baseItems.map((p, i) => (
                <button
                  key={p.id}
                  aria-label={`Go to product ${i + 1}`}
                  onClick={() => {
                    markInteraction();
                    scrollToIndex(setSize + i);
                  }}
                  className="group relative h-1 flex-1 overflow-hidden rounded-full bg-white/10 transition-all duration-300"
                >
                  <div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r from-[#d7ff53] to-[#f6ffb8] transition-all duration-500 ${
                      logicalActive === i
                        ? "w-full opacity-100"
                        : "w-0 opacity-0 group-hover:opacity-50 group-hover:w-1/2"
                    }`}
                    style={logicalActive === i ? { boxShadow: "0 0 12px rgba(215,255,83,0.6)" } : undefined}
                  />
                </button>
              ))}
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-white/45 backdrop-blur-md sm:flex">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  paused
                    ? "bg-white/30"
                    : hovering
                    ? "bg-yellow-300"
                    : "bg-[#d7ff53] animate-pulse-soft"
                }`}
              />
              {paused ? "Paused" : hovering ? "Hover" : "Live"}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-white/35">
            <span>
              {paused
                ? "Auto-scroll paused"
                : "Auto-scroll · Drag to interrupt"}
            </span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
        </div>
      </div>

      {/* ===== Bottom CTA ===== */}
      <Reveal delay={200}>
        <div className="mx-auto mt-14 max-w-7xl px-4 md:px-8">
          <Link
            href="/products"
            className="magnetic btn-shine group inline-flex items-center gap-3 overflow-hidden rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white backdrop-blur-md transition-all duration-300 hover:border-[#d7ff53] hover:bg-[#d7ff53] hover:text-black"
          >
            <span className="relative">View All Products</span>
            <span className="relative h-1.5 w-1.5 rounded-full bg-[#d7ff53] transition-transform duration-300 group-hover:scale-150 group-hover:bg-black" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/* ============================================================ */
/*  Ambient particles — tiny floating lime dots                  */
/* ============================================================ */
function AmbientParticles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const particles = [
    { left: "8%", top: "20%", delay: 0, dur: 12, size: 2 },
    { left: "15%", top: "70%", delay: 2, dur: 14, size: 1.5 },
    { left: "32%", top: "35%", delay: 1, dur: 11, size: 2.5 },
    { left: "45%", top: "75%", delay: 3, dur: 13, size: 1.5 },
    { left: "58%", top: "20%", delay: 0.5, dur: 15, size: 2 },
    { left: "68%", top: "60%", delay: 2.5, dur: 12, size: 1.5 },
    { left: "78%", top: "30%", delay: 1.5, dur: 14, size: 2 },
    { left: "88%", top: "70%", delay: 3.5, dur: 13, size: 2.5 },
    { left: "92%", top: "15%", delay: 2, dur: 11, size: 1.5 },
    { left: "22%", top: "85%", delay: 4, dur: 15, size: 2 },
    { left: "50%", top: "10%", delay: 1, dur: 12, size: 1.5 },
    { left: "72%", top: "90%", delay: 2.5, dur: 14, size: 2 },
  ];

  return (
    <>
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-[#d7ff53]"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: 0,
            boxShadow: "0 0 6px rgba(215,255,83,0.8)",
            animation: `particle-float ${p.dur}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </>
  );
}

/* ============================================================ */
/*  RACK ITEM — single hanging garment                          */
/* ============================================================ */

function ProductRackItem({
  product,
  isComingSoon,
  index,
  logicalIndex,
  isActive,
  onUserInteract,
}: {
  product: Product;
  isComingSoon: boolean;
  index: number;
  logicalIndex: number;
  isActive: boolean;
  onUserInteract: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const imgSrc =
    product.image ||
    product.product_images?.[0]?.image_url ||
    "https://images.unsplash.com/photo-1523398002811-999ca8dec234?q=80&w=1200&auto=format&fit=crop";

  // Depth-of-field: blur based on distance from active
  const distanceFromActive = Math.min(Math.abs(index - logicalIndex), Math.abs(index - logicalIndex - 6), Math.abs(index - logicalIndex + 6));
  const depthBlur = isActive ? 0 : Math.min(distanceFromActive * 0.6, 1.5);

  return (
    <div
      className="relative shrink-0"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted
          ? "translateY(0) scale(1)"
          : `translateY(50px) scale(0.94)`,
        transition: `all 1100ms cubic-bezier(0.16, 1, 0.3, 1) ${
          500 + (index % 12) * 90
        }ms`,
      }}
    >
      {/* ===== Hanger SVG — swinging ===== */}
      <div
        className={`pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 transition-all duration-500 ${
          isActive ? "-top-5 opacity-100" : "-top-4 opacity-50"
        }`}
        aria-hidden
      >
        <svg
          width="44"
          height="50"
          viewBox="0 0 44 50"
          className={`${isActive ? "text-[#d7ff53]/80" : "text-white/30"} ${isActive ? "animate-hanger-swing" : ""}`}
        >
          <path
            d="M22 4 Q15 4 15 11 Q15 18 22 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M3 26 Q3 20 11 18 L33 18 Q41 20 41 26"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="22"
            y1="18"
            x2="22"
            y2="26"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="22"
            y1="26"
            x2="22"
            y2="34"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray="2 2"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* ===== The card ===== */}
      <Link
        href={isComingSoon ? "/products" : `/products/${product.slug}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={onUserInteract}
        className={`group block w-[270px] transition-all duration-700 sm:w-[310px] md:w-[340px] ${
          isActive ? "scale-100" : "scale-[0.94] opacity-65"
        }`}
        style={{
          filter: isActive ? "saturate(1.08)" : `saturate(0.85) blur(${depthBlur}px)`,
        }}
      >
        {/* Spotlight halo behind active card — stronger + animated */}
        <div
          className={`pointer-events-none absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-[#d7ff53]/30 via-transparent to-[#5e8bff]/20 blur-2xl transition-opacity duration-700 ${
            isActive ? "opacity-100" : "opacity-0"
          }`}
          style={isActive ? { animation: "aurora-drift-1 8s ease-in-out infinite alternate" } : undefined}
        />

        <div
          className={`relative overflow-hidden rounded-3xl p-3 backdrop-blur-md transition-all duration-500 group-hover:-translate-y-1 ${
            isComingSoon
              ? "rainbow-border"
              : "border border-white/10 bg-white/[0.02] group-hover:border-[#d7ff53]/50 group-hover:bg-white/[0.05]"
          }`}
        >
          <div className="pointer-events-none absolute inset-px rounded-[1.4rem] bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02]" />

          {/* Image container */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.01]">
            {/* Holo sweep on hover */}
            <div className="holo-sweep pointer-events-none absolute inset-0 z-10" />

            {/* Film grain over image */}
            <div
              className="pointer-events-none absolute inset-0 z-[1] opacity-[0.05] mix-blend-overlay"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
              }}
            />

            <Image
              src={imgSrc}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 80vw, 340px"
              className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/30 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/40 to-transparent" />

            {/* Top-left: tag badge */}
            <div className="absolute left-3 top-3 z-20">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7ff53]/40 bg-[#0b0b0b]/70 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-[#d7ff53] backdrop-blur-md">
                <span className="h-1 w-1 rounded-full bg-[#d7ff53] animate-pulse-soft" />
                {product.tag || product.category || "Merch"}
              </span>
            </div>

            {/* Top-right: index */}
            <div className="absolute right-3 top-3 z-20 rounded-md border border-white/10 bg-[#0b0b0b]/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white/50 backdrop-blur-md">
              No. {String(logicalIndex + 1).padStart(2, "0")}
            </div>

            {/* Bottom info */}
            <div className="absolute inset-x-0 bottom-0 z-20 p-5">
              <h3
                className={`font-display text-xl font-black uppercase leading-tight tracking-tight transition-colors duration-500 md:text-2xl ${
                  hover ? "text-[#d7ff53]" : "text-white"
                }`}
              >
                {product.name}
              </h3>
              <p className="mt-1.5 line-clamp-1 text-[11px] text-white/50">
                {product.description}
              </p>
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center justify-between px-2 py-4">
            <p
              key={isActive ? "active" : "inactive"}
              className="font-display text-lg font-black tracking-tight md:text-xl"
              style={{ animation: isActive ? "count-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both" : undefined }}
            >
              {isComingSoon ? (
                <span className="gradient-text-cycle">Coming Soon</span>
              ) : (
                `Rp${(product.price || 0).toLocaleString("id-ID")}`
              )}
            </p>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-500 ${
                hover
                  ? "border-[#d7ff53] bg-[#d7ff53] text-black scale-110"
                  : "border-white/10 bg-white/5 text-white"
              }`}
            >
              {hover ? (
                <ShoppingBag className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </div>
          </div>

          <div
            className={`absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d7ff53] to-transparent transition-opacity duration-500 ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
            style={isActive ? { boxShadow: "0 0 8px rgba(215,255,83,0.5)" } : undefined}
          />
        </div>
      </Link>
    </div>
  );
}
