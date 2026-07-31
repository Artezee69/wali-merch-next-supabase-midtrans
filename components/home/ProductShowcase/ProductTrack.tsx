"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

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

export default function ProductTrack({ items }: { items: Product[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    startX.current = e.clientX;
    const el = trackRef.current;
    scrollLeft.current = el ? el.scrollLeft : 0;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const el = trackRef.current;
    if (!el) return;
    const x = e.clientX - startX.current;
    el.scrollLeft = scrollLeft.current - x;
  };

  const onPointerUp = () => setDragging(false);

  return (
    <div className="relative">
      {/* Side fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent md:w-40 dark:from-black dark:md:from-gray-950" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent md:w-40 dark:from-black dark:md:from-gray-950" />

      <div
        ref={trackRef}
        className="flex gap-4 sm:gap-5 md:gap-7 overflow-x-auto px-4 sm:px-5 md:px-10 pb-6 pt-8 touch-pan-x"
        style={{ scrollbarWidth: "none", cursor: dragging ? "grabbing" : "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {items.map((product, i) => (
          <ProductCard key={`${product.id}-${i}`} product={product} index={i} />
        ))}
      </div>

      {/* Active indicator line at bottom */}
      <div className="relative mx-5 h-px bg-gray-200 md:mx-10 dark:bg-white/[0.06]">
        <div
          className="absolute inset-y-0 left-0 bg-[#d7ff53]/20 transition-all duration-300"
          style={{
            width: dragging ? "100%" : "0%",
            opacity: dragging ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================ */
/*  SINGLE CARD                                                  */
/* ============================================================ */

function ProductCard({ product, index }: { product: Product; index: number }) {
  const [hovered, setHovered] = useState(false);
  const comingSoon = product.price === 0 || product.category === "Coming Soon";
  const imgSrc = product.image || product.product_images?.[0]?.image_url || "";
  const href = comingSoon ? "/products" : `/products/${product.slug}`;

  return (
    <Link
      href={href}
      className="shrink-0 group/card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <article className="w-[240px] sm:w-[280px] md:w-[320px] lg:w-[340px]">
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-200 dark:bg-[#111]">
          {imgSrc && (
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-110"
            />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent dark:from-black/70 dark:via-black/10" />

          {/* Tag */}
          {product.tag && (
            <div className="absolute left-3 top-3 z-10">
              <span className="rounded-full border border-gray-300 bg-white/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-gray-700 backdrop-blur dark:border-white/10 dark:bg-black/60 dark:text-white/60">
                {product.tag}
              </span>
            </div>
          )}

          {/* Hover CTA */}
          {!comingSoon && (
            <div className="absolute inset-0 z-10 flex items-end justify-center pb-4 sm:pb-6 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
              <span className="rounded-full bg-[#d7ff53] px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-black shadow-lg">
                Quick View
              </span>
            </div>
          )}

          {/* Coming Soon */}
          {comingSoon && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <span className="rounded-full border border-gray-300 bg-white/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 backdrop-blur dark:border-white/20 dark:bg-black/70 dark:text-white/60">
                Coming Soon
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-3 flex items-start justify-between gap-2 px-1">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[13px] sm:text-sm font-bold leading-snug text-gray-900 dark:text-white/90 transition-colors duration-300 group-hover/card:text-[#d7ff53]">
              {product.name}
            </h3>
            <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-white/35 line-clamp-1">
              {product.description}
            </p>
          </div>
          {!comingSoon && (
            <p className="shrink-0 pt-0.5 text-[12px] sm:text-sm font-black text-gray-700 dark:text-white/70">
              Rp{(product.price || 0).toLocaleString("id-ID")}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}