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
      <div
        ref={trackRef}
        className="flex snap-x gap-5 overflow-x-auto px-1 pb-6 pt-4 sm:gap-6 md:px-4"
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

      {/* Progress line */}
      <div className="relative h-px bg-white/[0.08]">
        <div
          className="absolute inset-y-0 left-0 bg-[#d7ff53] transition-all duration-300"
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
  const comingSoon = product.price === 0 || product.category === "Coming Soon";
  const imgSrc = product.image || product.product_images?.[0]?.image_url || "";
  const href = comingSoon ? "/products" : `/products/${product.slug}`;

  return (
    <Link
      href={href}
      className="group/card shrink-0 snap-start"
    >
      <article className="w-[150px] sm:w-[280px] md:w-[340px]">
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-2xl shadow-black/40 transition-all duration-500 group-hover/card:-translate-y-1.5 group-hover/card:border-[#d7ff53]/25 group-hover/card:shadow-[0_16px_48px_-12px_rgba(215,255,83,0.15)]">
          {imgSrc && (
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 40vw, 340px"
              loading="lazy"
              decoding="async"
              className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
            />
          )}

          {/* Tag */}
          {product.tag && !comingSoon && (
            <div className="absolute left-3 top-3 z-10 sm:left-4 sm:top-4">
              <span className="rounded-full border border-white/15 bg-black/70 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-white/90 backdrop-blur-md sm:px-3 sm:py-1.5 sm:text-[10px]">
                {product.tag}
              </span>
            </div>
          )}

          {/* Hover CTA — desktop only */}
          {!comingSoon && (
            <div className="absolute inset-0 z-10 hidden items-end justify-center pb-5 opacity-0 sm:flex sm:transition-opacity sm:duration-300 sm:group-hover/card:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <span className="relative rounded-full bg-[#d7ff53] px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-black shadow-[0_8px_24px_rgba(215,255,83,0.4)]">
                Quick View
              </span>
            </div>
          )}

          {/* Coming Soon */}
          {comingSoon && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
              <span className="rounded-full border border-white/15 bg-black/80 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/70 backdrop-blur-md sm:px-5 sm:py-2 sm:text-[11px]">
                Coming Soon
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-3.5 flex items-start justify-between gap-2 px-1 sm:mt-4 sm:gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xs font-bold text-white transition-colors duration-300 group-hover/card:text-[#d7ff53] sm:text-sm">
              {product.name}
            </h3>
            <p className="mt-1 line-clamp-1 text-[10px] text-white/40 sm:text-xs">
              {product.description}
            </p>
          </div>
          {!comingSoon && (
            <p className="shrink-0 pt-0.5 text-xs font-black text-white/90 sm:text-sm">
              Rp{(product.price || 0).toLocaleString("id-ID")}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
