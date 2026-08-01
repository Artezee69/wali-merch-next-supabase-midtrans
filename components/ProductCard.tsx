"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
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
    base_price?: number | null;       // Harga asli untuk diskon
    sale_price?: number | null;      // Harga diskon
    category?: string | null;
    description?: string | null;
    product_images?: { image_url: string }[] | null;
    product_variants?: Variant[] | null;
    soldCount?: number;              // Jumlah produk terjual
    rating?: {                       // Rating ulasan
      avg: number;                   // Rata-rata bintang (0-5)
      count: number;                 // Jumlah ulasan
    };
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

  // Discount detection: sale_price exists and is less than base_price
  const hasDiscount = Boolean(
    product.sale_price != null &&
    product.base_price != null &&
    Number(product.sale_price) < Number(product.base_price)
  );

  let discountPercent = 0;
  if (hasDiscount) {
    const base = Number(product.base_price);
    const sale = Number(product.sale_price);
    if (base > 0) {
      discountPercent = Math.round(((base - sale) / base) * 100);
    }
  }

  // Rating and sold quantity
  const soldCount = product.soldCount ?? 0;
  const rating = product.rating;
  const hasRating = rating && typeof rating.avg === "number" && rating.count > 0;
  const formattedRating = hasRating ? rating.avg.toFixed(1) : null;

  // Star rating rendering helper - displays 5 stars with filled/empty state
  const renderStars = (ratingValue: number) => {
    const fullStars = Math.floor(ratingValue);
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        fill={i < fullStars ? "#d7ff53" : "transparent"}
        stroke={i < fullStars ? "#d7ff53" : "#374151"}
        strokeWidth={1.5}
        className="transition"
      />
    ));
  };

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
        {/* Subtle outer glow on hover */}
        <div
          className="pointer-events-none absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-[#d7ff53]/20 via-transparent to-white/5 opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-100"
          aria-hidden
        />

        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/5 bg-black/30 backdrop-blur-sm transition-all duration-500 group-hover:border-white/10 group-hover:bg-black/50 sm:p-3 dark:border-gray-800 dark:bg-gray-900/[0.1] group-hover:dark:border-[#d7ff53]/30 group-hover:dark:bg-[#d7ff53]/5 flex flex-col h-full">
          {/* Subtle inner frame glow */}
          <div
            className="pointer-events-none absolute inset-px rounded-[1.4rem] bg-gradient-to-br from-white/5 via-transparent to-black/20 dark:from-white/5 dark:via-transparent dark:to-black/30"
            aria-hidden
          />

          {/* Image container */}
          <div className="group/img relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-900">
            <Image
              src={getImage(product)}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-all duration-700 ease-out group-hover:scale-105"
              style={{ filter: "saturate(1)" }}
            />

            {/* Top-left badges */}
            <div className="absolute left-3 top-3 z-20 flex flex-col gap-2 sm:left-4 sm:top-4 sm:gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/40 bg-green-100 dark:bg-green-900/40 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-green-700 dark:text-green-400 backdrop-blur-sm sm:px-3">
                <span className="h-1 w-1 rounded-full bg-green-600 dark:bg-[#d7ff53] animate-pulse-soft" />
                {product.category || "Merch"}
              </span>
              {/* Discount badge - shows when sale_price < base_price */}
              {hasDiscount && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-red-700 dark:text-red-300 backdrop-blur-sm dark:border-red-400/50">
                  DISCOUNT {discountPercent}%
                </span>
              )}
              {isSoldOut && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-red-700 dark:text-red-300 backdrop-blur-sm dark:border-red-400/50">
                  Sold Out
                </span>
              )}
              {isComingSoon && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-400/30 bg-gray-700/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 backdrop-blur-md dark:border-gray-500/40 dark:bg-gray-600/40 dark:text-gray-200">
                  Coming Soon
                </span>
              )}
            </div>

            {/* Top-right stock indicator */}
            {!isComingSoon && (
              <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-gray-900/70 px-2.5 py-1 backdrop-blur-md sm:right-4 sm:top-4 dark:border-gray-700 dark:bg-gray-800/70">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    totalStock > 10
                      ? "bg-accent animate-pulse-soft"
                      : totalStock > 0
                      ? "bg-yellow-400"
                      : "bg-red-400"
                  }`}
                />
                <span className="font-mono text-[10px] font-bold tracking-widest text-white/70 dark:text-gray-300/70">
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
              <div className="rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl sm:p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d7ff53] sm:text-xs">
                  Official Merchandise
                </p>
                <h3
                  className={`mt-1.5 line-clamp-2 font-display text-base font-black uppercase leading-tight tracking-tight transition-colors duration-500 sm:mt-2 sm:text-lg ${
                    hover ? "text-accent" : "text-gray-100 dark:text-gray-300"
                  }`}
                >
                  {product.name}
                </h3>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col h-full min-h-[0]">
            {/* Fixed-height description section - ALL BOXES SAME HEIGHT */}
            <div className="p-3 sm:p-5 bg-black/20 backdrop-blur-sm overflow-hidden">
              <div className="h-[3.5rem] overflow-hidden flex flex-col justify-end"> {/* Fixed height ~56px */}
                <p className="text-xs sm:text-sm leading-relaxed text-gray-300 dark:text-gray-300 line-clamp-2">
                  {product.description || "Premium official merchandise collection."}
                </p>
              </div>
            </div>

            {/* Price & CTA section - Remaining space */}
            <div className="p-3 sm:p-5 pt-2 sm:pt-3 bg-black/20 backdrop-blur-sm flex flex-col gap-3 sm:gap-4">
              {/* Price display */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 sm:text-xs mb-1">Price</p>
                <div className="flex flex-col">
                  {isComingSoon ? (
                    // Coming Soon
                    <span className="font-display text-lg font-black text-gray-500 sm:text-xl">Coming Soon</span>
                  ) : hasDiscount ? (
                    // Discounted product - show original price with strikethrough and sale price
                    <div className="flex items-baseline gap-2">
                      {/* Original price with strikethrough */}
                      <span className="font-display text-base font-black text-gray-400 line-through">
                        {rupiah(product.base_price ?? product.price)}
                      </span>
                      {/* Sale price prominent */}
                      <span className="font-display text-lg font-black text-[#d7ff53] sm:text-xl">
                        {rupiah(product.sale_price ?? product.price)}
                      </span>
                      {/* Discount percentage badge */}
                      <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                        -{discountPercent}%
                      </span>
                    </div>
                  ) : (
                    // Regular price
                    <span className="font-display text-lg font-black text-white dark:text-white sm:text-xl">
                      {rupiah(Number(product.price))}
                    </span>
                  )}
                </div>
              </div>

              {/* Rating & Sold count - display if available */}
              {hasRating || soldCount > 0 && (
                <div className="flex items-center justify-between text-[11px] sm:text-xs py-2 border-b border-white/5 mb-2">
                  {/* Rating stars + count */}
                  {hasRating && (
                    <div className="flex items-center gap-1">
                      {renderStars(rating.avg)}
                      <span className="text-white/75">{formattedRating}</span>
                      <span className="text-white/45 ml-1">({rating.count} review)</span>
                    </div>
                  )}
                  {/* Sold count on right */}
                  {soldCount > 0 && (
                    <span className="text-[#d7ff53] font-black">
                      {soldCount} terjual
                    </span>
                  )}
                </div>
              )}

              {/* Elegant CTA button */}
              <div className="pt-2 sm:pt-3 border-t border-white/5">
                <div
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-500 active:scale-95 ${
                    isComingSoon
                      ? "bg-gray-800/50 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#d7ff53] to-[#c7ef33] text-black hover:scale-[1.02] shadow-lg hover:shadow-[0_10px_30px_rgba(215,255,83,0.3)]"
                  }`}>
                  <span>{isComingSoon ? "Coming Soon" : "View Detail"}</span>
                  {!isComingSoon && (
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}