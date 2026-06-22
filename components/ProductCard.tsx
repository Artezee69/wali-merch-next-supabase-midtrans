"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Eye } from "lucide-react";
import { rupiah } from "@/lib/format";
import { useState, useEffect } from "react";

type Variant = {
  id?: string;
  size: string;
  stock: number;
};

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    category?: string | null;
    description?: string | null;
    product_images?: { image_url: string }[] | null;
    product_variants?: Variant[] | null;
  };
  index?: number;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523398002811-999ca8dec234?q=80&w=1200&auto=format&fit=crop";

function getTotalStock(product: ProductCardProps["product"]): number {
  return (
    product.product_variants?.reduce(
      (total, v) => total + Number(v.stock || 0),
      0
    ) || 0
  );
}

function getImage(product: ProductCardProps["product"]): string {
  return product.product_images?.[0]?.image_url || FALLBACK_IMAGE;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const totalStock = getTotalStock(product);
  const isComingSoon =
    product.category === "Coming Soon" || product.price === 0;
  const isSoldOut = totalStock <= 0 && !isComingSoon;

  const [hover, setHover] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    setMounted(true);
    // delay info reveal slightly after card appears
    const t = setTimeout(() => setShowInfo(true), 400 + index * 80);
    return () => clearTimeout(t);
  }, [index]);

  const href = isComingSoon ? "/products" : `/products/${product.slug}`;

  return (
    <div
      className="group relative"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 900ms cubic-bezier(0.16, 1, 0.3, 1) ${
          index * 80
        }ms, transform 900ms cubic-bezier(0.16, 1, 0.3, 1) ${index * 80}ms`,
      }}
    >
      <Link
        href={href}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="block"
      >
        {/* Outer glow ring on hover */}
        <div
          className="pointer-events-none absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-[#d7ff53]/20 via-transparent to-[#5e8bff]/10 opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-100"
          aria-hidden
        />

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur-sm transition-all duration-500 group-hover:border-[#d7ff53]/40 group-hover:bg-white/[0.04] sm:rounded-[2rem] sm:p-3">
          {/* Subtle inner frame gradient */}
          <div
            className="pointer-events-none absolute inset-px rounded-[1.4rem] bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02]"
            aria-hidden
          />

          {/* Image container */}
          <div className="group/img relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.01]">
            {/* Shimmer on hover */}
            <div
              className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.10) 50%, transparent 70%)",
                backgroundSize: "200% 200%",
                animation: hover ? "shimmer 1.8s linear infinite" : "none",
              }}
              aria-hidden
            />

            <Image
              src={getImage(product)}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-all duration-700 ease-out group-hover:scale-110"
              style={{
                filter: hover ? "saturate(1.05)" : "saturate(0.92)",
              }}
            />

            {/* Cinematic overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/20 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/30 to-transparent" />

            {/* Top-left badges */}
            <div className="absolute left-3 top-3 z-20 flex flex-col gap-2 sm:left-4 sm:top-4 sm:gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7ff53]/30 bg-[#0b0b0b]/70 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#d7ff53] backdrop-blur-md sm:px-3">
                <span className="h-1 w-1 rounded-full bg-[#d7ff53] animate-pulse-soft" />
                {product.category || "Merch"}
              </span>
              {isSoldOut && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-red-300 backdrop-blur-md">
                  Sold Out
                </span>
              )}
              {isComingSoon && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md">
                  Coming Soon
                </span>
              )}
            </div>

            {/* Top-right stock indicator */}
            {!isComingSoon && (
              <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0b0b0b]/70 px-2.5 py-1 backdrop-blur-md sm:right-4 sm:top-4">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    totalStock > 10
                      ? "bg-[#d7ff53] animate-pulse-soft"
                      : totalStock > 0
                      ? "bg-yellow-400"
                      : "bg-red-400"
                  }`}
                />
                <span className="font-mono text-[10px] font-bold tracking-widest text-white/70">
                  {totalStock > 0 ? `${totalStock} pcs` : "Habis"}
                </span>
              </div>
            )}

            {/* Bottom info card */}
            <div
              className="absolute inset-x-3 bottom-3 z-20 sm:inset-x-4 sm:bottom-4"
              style={{
                opacity: showInfo ? 1 : 0,
                transform: showInfo ? "translateY(0)" : "translateY(8px)",
                transition:
                  "all 700ms cubic-bezier(0.16, 1, 0.3, 1) 300ms",
              }}
            >
              <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/70 p-3 backdrop-blur-xl sm:p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d7ff53] sm:text-xs">
                  Official Merchandise
                </p>
                <h3
                  className={`mt-1.5 line-clamp-2 font-display text-base font-black uppercase leading-tight tracking-tight transition-colors duration-500 sm:mt-2 sm:text-lg ${
                    hover ? "text-[#d7ff53]" : "text-white"
                  }`}
                >
                  {product.name}
                </h3>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5">
            <p className="line-clamp-2 min-h-[3.5rem] text-sm leading-7 text-white/55">
              {product.description ||
                "Official merchandise collection with premium streetwear feel."}
            </p>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4 sm:mt-5 sm:gap-4 sm:pt-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 sm:text-xs">
                  Price
                </p>
                <p className="font-display text-lg font-black text-white sm:text-xl">
                  {isComingSoon ? (
                    <span className="text-[#d7ff53]">Coming Soon</span>
                  ) : (
                    rupiah(Number(product.price))
                  )}
                </p>
              </div>

              {/* Variants dots */}
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 sm:text-xs">
                  Sizes
                </p>
                <div className="mt-1 flex justify-end gap-1">
                  {product.product_variants?.length
                    ? product.product_variants.slice(0, 4).map((v, i) => (
                        <span
                          key={v.id || `${v.size}-${i}`}
                          className={`flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-black ${
                            Number(v.stock) > 0
                              ? "border-white/10 bg-white/5 text-white/70"
                              : "border-red-400/20 bg-red-500/10 text-red-300/60 line-through"
                          }`}
                        >
                          {v.size.toString().slice(0, 2)}
                        </span>
                      ))
                    : null}
                </div>
              </div>
            </div>

            {/* CTA row */}
            <div
              className={`mt-4 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] transition-all duration-500 sm:mt-5 sm:py-3 sm:text-sm ${
                hover
                  ? "bg-[#d7ff53] text-black"
                  : "bg-white/[0.04] text-white/80"
              }`}
            >
              <span>{isComingSoon ? "Coming Soon" : "View Detail"}</span>
              {hover ? (
                <ShoppingBag className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}