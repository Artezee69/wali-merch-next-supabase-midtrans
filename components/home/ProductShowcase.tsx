"use client";

import { useRef, useState, useEffect } from "react";
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

const fallbackProducts: Product[] = [
  {
    id: "fb-1",
    name: "Player Edition Tee",
    price: 199000,
    tag: "Newest Drop",
    slug: "player-edition-tee",
    description: "Sablon DTF premium dengan detail player edition.",
    image: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "fb-2",
    name: "Regular Logo Tee",
    price: 159000,
    tag: "Essential",
    slug: "regular-logo-tee",
    description: "Logo reguler warna solid, basic essential untuk daily wear.",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "fb-3",
    name: "Vintage Stage Series",
    price: 0,
    tag: "Limited",
    category: "Coming Soon",
    description: "Coming soon. Pantau terus drop selanjutnya.",
    image: "https://images.unsplash.com/photo-1506629905607-d9f297d7fbc4?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "fb-4",
    name: "Stage Hoodie Blackout",
    price: 349000,
    tag: "Player Edition",
    slug: "stage-hoodie-blackout",
    description: "Hoodie heavyweight 400gsm dengan detail bordir punggung.",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "fb-5",
    name: "Tour Cap Snapback",
    price: 129000,
    tag: "Accessories",
    slug: "tour-cap-snapback",
    description: "Topi snapback dengan bordur logo tour resmi.",
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "fb-6",
    name: "Stage Crew Long Sleeve",
    price: 229000,
    tag: "Stage Crew",
    slug: "stage-crew-long-sleeve",
    description: "Long sleeve dengan print stage crew official.",
    image: "https://images.unsplash.com/photo-162244527576-721325763afe?q=80&w=600&auto=format&fit=crop",
  },
];

/* ============================================================ */
/*  MAIN — draggable scroll track with bold headline             */
/* ============================================================ */

const headings = ["Fresh Kills", "New Drops", "Next Batch", "New Arrivals"];

export default function ProductShowcase({ products }: { products?: Product[] }) {
  const items = products && products.length > 0 ? products : fallbackProducts;
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const [headingIdx, setHeadingIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHeadingIdx((p) => (p + 1) % headings.length), 4000);
    return () => clearInterval(t);
  }, []);

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
    <section id="section-products" className="relative bg-[#0b0b0b] pt-20 pb-28 md:pt-28 md:pb-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0b0b0b] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0b0b0b] to-transparent" />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes heading-pop {
          from { opacity: 0; transform: translateY(24px) scale(0.96); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
      ` }} />

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* — Big headline — */}
        <div className="mb-8 flex items-end justify-between gap-4 md:mb-12">
          <div className="overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#d7ff53]/50">
              Season 01 · Collection 26
            </p>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white transition-all duration-600 md:text-6xl lg:text-7xl">
              <span
                key={headingIdx}
                className="inline-block"
                style={{
                  animation: "heading-pop 700ms cubic-bezier(0.16, 1, 0.3, 1) both",
                }}
              >
                {headings[headingIdx]}
              </span>
            </h2>
          </div>

          <Link
            href="/products"
            className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/60 backdrop-blur transition-all duration-300 hover:border-[#d7ff53]/40 hover:bg-[#d7ff53]/10 hover:text-[#d7ff53] md:px-6"
          >
            View All
          </Link>
        </div>

        {/* — Scrollable track — */}
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
      </div>
    </section>
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
