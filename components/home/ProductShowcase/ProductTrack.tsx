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
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#0b0b0b] to-transparent md:w-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#0b0b0b] to-transparent md:w-40" />

      <div
        ref={trackRef}
        className="flex gap-5 overflow-x-auto px-5 pb-6 pt-8 md:gap-7 md:px-10"
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
      <div className="relative mx-5 h-px bg-white/[0.06] md:mx-10">
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
      <article className="w-[260px] sm:w-[300px] md:w-[340px]">
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#111]">
          {imgSrc && (
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-110"
            />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Tag */}
          {product.tag && (
            <div className="absolute left-3 top-3 z-10">
              <span className="rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/60 backdrop-blur">
                {product.tag}
              </span>
            </div>
          )}

          {/* Hover CTA */}
          {!comingSoon && (
            <div className="absolute inset-0 z-10 flex items-end justify-center pb-4 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
              <span className="rounded-full bg-[#d7ff53] px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-black">
                Quick View
              </span>
            </div>
          )}

          {/* Coming Soon */}
          {comingSoon && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <span className="rounded-full border border-white/20 bg-black/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 backdrop-blur">
                Coming Soon
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-3 flex items-start justify-between gap-2 px-1">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold leading-snug text-white/90 transition-colors duration-300 group-hover/card:text-[#d7ff53]">
              {product.name}
            </h3>
            <p className="mt-0.5 truncate text-[11px] text-white/35">
              {product.description}
            </p>
          </div>
          {!comingSoon && (
            <p className="shrink-0 pt-0.5 text-sm font-black text-white/70">
              Rp{(product.price || 0).toLocaleString("id-ID")}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}