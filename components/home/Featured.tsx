"use client";

import Image from "next/image";
import Link from "next/link";
import Reveal from "./Reveal";

export default function Featured({ products }: { products?: any[] }) {
  const fallbackProducts = [
    {
      id: "fallback-1",
      name: "Player Edition T-Shirt",
      price: 199000,
      tag: "Newest Drop",
      image:
        "https://images.unsplash.com/photo-1523398002811-999ca8dec234?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "fallback-2",
      name: "Regular Logo T-Shirt",
      price: 159000,
      tag: "Essential",
      image:
        "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "fallback-3",
      name: "Vintage Stage Series",
      price: 0,
      tag: "Limited",
      image:
        "https://images.unsplash.com/photo-1506629905607-d9f297d7fbc4?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  const displayProducts =
    products && products.length > 0 ? products : fallbackProducts;

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
      <Reveal>
        <div className="mb-14 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-[#d7ff53]">
              <span className="h-px w-8 bg-[#d7ff53]" />
              Latest Drop
            </div>
            <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-[-0.02em] md:text-6xl">
              Fresh Off The
              <br />
              <span className="bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
                Press.
              </span>
            </h2>
          </div>
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-white/60 transition hover:text-[#d7ff53]"
          >
            <span>View All Products</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#d7ff53] transition-transform duration-300 group-hover:scale-150" />
          </Link>
        </div>
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {displayProducts.map((product: any, i) => {
          const isComingSoon =
            product.price === 0 || product.category === "Coming Soon";

          return (
            <Reveal key={product.id} delay={i * 100} className="group">
              <Link
                href={isComingSoon ? "/products" : `/products/${product.slug}`}
                className="block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur-sm transition-all duration-500 hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-white/5">
                  <Image
                    src={
                      product.image ||
                      product.product_images?.[0]?.image_url ||
                      fallbackProducts[0].image
                    }
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b]/90 via-transparent to-transparent" />
                  {/* Tag badge */}
                  <div className="absolute left-4 top-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7ff53]/30 bg-[#d7ff53]/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#d7ff53] backdrop-blur-md">
                      {product.tag || product.category || "Merch"}
                    </span>
                  </div>
                  {/* Product name */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="line-clamp-2 font-display text-lg font-black uppercase leading-tight tracking-tight md:text-xl">
                      {product.name}
                    </h3>
                  </div>
                </div>
                <div className="p-5">
                  <p className="line-clamp-2 min-h-[2.8rem] text-sm leading-7 text-white/55">
                    {product.description ||
                      "Official merchandise WALI dengan kualitas premium."}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
                    <p className="font-display text-lg font-black">
                      {isComingSoon ? (
                        <span className="text-[#d7ff53]">Coming Soon</span>
                      ) : (
                        `Rp${(product.price || 0).toLocaleString("id-ID")}`
                      )}
                    </p>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#d7ff53] transition-transform duration-300 group-hover:scale-150" />
                  </div>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}