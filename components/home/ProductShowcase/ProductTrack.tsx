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
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent md:w-24 dark:from-black dark:md:from-gray-950" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent md:w-24 dark:from-black dark:md:from-gray-950" />

      <div
        ref={trackRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-6 pb-6 pt-6 md:gap-7 md:px-8"
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

      {/* Active indicator line */}
      <div className="relative mx-4 h-px bg-gray-200 md:mx-8 dark:bg-white/[0.06]">
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
      <article className="w-[160px] sm:w-[200px] md:w-[240px] lg:w-[260px]">
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl sm:rounded-2xl bg-gray-200 dark:bg-[#111]">
          {imgSrc && (
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-110"
            />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent dark:from-black/70 dark:via-black/10" />

          {/* Tag */}
          {product.tag && (
            <div className="absolute left-2 top-2 z-10 sm:left-3 sm:top-3">
              <span className="rounded-full border border-gray-300 bg-white/90 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] text-gray-700 backdrop-blur dark:border-white/10 dark:bg-black/70 dark:text-white/70 sm:px-2.5 sm:py-1 sm:text-[9px]">
                {product.tag}
              </span>
            </div>
          )}

          {/* Hover CTA */}
          {!comingSoon && (
            <div className="absolute inset-0 z-10 flex items-end justify-center pb-3 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 sm:pb-4">
              <span className="rounded-full bg-[#d7ff53] px-4 py-2 text-[9px] font-black uppercase tracking-[0.15em] text-black sm:px-6 sm:py-2.5 sm:text-[10px]">
                Quick View
              </span>
            </div>
          )}

          {/* Coming Soon */}
          {comingSoon && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <span className="rounded-full border border-gray-300 bg-white/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-gray-700 backdrop-blur dark:border-white/20 dark:bg-black/80 dark:text-white/70">
                Coming Soon
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-2 sm:mt-3 flex items-start justify-between gap-1.5 px-0.5">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[11px] font-bold leading-tight text-gray-900 transition-colors duration-300 group-hover/card:text-[#d7ff53] sm:text-sm dark:text-white/90">
              {product.name}
            </h3>
            <p className="mt-0.5 truncate text-[9px] text-gray-500 dark:text-white/35 sm:text-[11px]">
              {product.description}
            </p>
          </div>
          {!comingSoon && (
            <p className="shrink-0 pt-0.5 text-[11px] font-black text-gray-700 dark:text-white/70 sm:text-sm">
              Rp{(product.price || 0).toLocaleString("id-ID")}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
