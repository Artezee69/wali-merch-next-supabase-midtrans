"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X, Sparkles } from "lucide-react";
import ProductCard from "@/components/ProductCard";

type Variant = { id?: string; size: string; stock: number };

export type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  base_price?: number | null;       // Harga asli untuk diskon
  sale_price?: number | null;      // Harga diskon
  soldCount?: number;              // Jumlah terjual
  rating?: {                       // Rating ulasan
    avg: number;                   // Rata-rata bintang (0-5)
    count: number;                 // Jumlah ulasan
  };
  category?: string | null;
  description?: string | null;
  product_images?: { image_url: string }[] | null;
  product_variants?: Variant[] | null;
};


export default function ProductsExplorer({
  products,
  categories,
  initialCategory = "All",
  initialQuery = "",
}: {
  products: Product[];
  categories: string[];
  initialCategory?: string;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filteredCount = useMemo(() => {
    const q = query.toLowerCase().trim();
    return products.filter((product) => {
      const matchSearch = !q || product.name?.toLowerCase().includes(q) || product.description?.toLowerCase().includes(q) || product.category?.toLowerCase().includes(q);
      const matchCategory = category === "All" || product.category === category;
      return matchSearch && matchCategory;
    }).length;
  }, [products, query, category]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list = products.filter((product) => {
      const matchSearch =
        !q ||
        product.name?.toLowerCase().includes(q) ||
        product.description?.toLowerCase().includes(q) ||
        product.category?.toLowerCase().includes(q);

      const matchCategory =
        category === "All" || product.category === category;

      return matchSearch && matchCategory;
    });
    return list;
  }, [products, query, category]);

  
  return (
    <div className="relative min-h-screen">
      {/* ===== Ambient stage lighting — desktop only (mobile: no blur cost) ===== */}
      <div className="hidden pointer-events-none absolute inset-0 -z-10 overflow-hidden sm:block">
        <div className="absolute left-1/2 top-0 h-[120%] w-[140%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center_top,_rgba(215,255,83,0.15),_transparent_55%)]" />
        <div
          className="absolute left-[5%] top-[25%] h-[30vw] w-[30vw] rounded-full bg-[#1a1a1a]/40 blur-[150px] animate-aurora-2"
          style={{ filter: "blur(150px)" }}
        />
        <div
          className="absolute right-[5%] bottom-[25%] h-[30vw] w-[30vw] rounded-full bg-[#0a0a0a]/40 blur-[150px] animate-aurora-1"
          style={{ filter: "blur(150px)" }}
        />
        <div className="absolute inset-0 bg-grid-fade [background-size:64px_64px] opacity-[0.18]" />
        {/* Floor line */}
        <div className="absolute bottom-[180px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>

      {/* ===== Toolbar section ===== */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:py-10 md:px-8 md:py-14">
        <div
          className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] border border-gray-300 dark:border-white/10 bg-gray-100 dark:bg-white/[0.02] p-4 sm:backdrop-blur md:p-5 light:bg-gray-100 light:border-gray-300"
          style={{
            opacity: 1,
            transform: "translateY(0)",
          }}
        >
          {/* Subtle inner glow on hover */}
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-[2.5rem] bg-gradient-to-br from-white/[0.02] via-transparent to-white/[0.02]" />

          {/* ===== Top row: search + filter toggle ===== */}
          <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:gap-4">
            {/* Search input with icon and clear button */}
            <div className="relative flex-1">
              <div className="pointer-events-none absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 light:text-gray-500">
                <Search className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-gray-400 dark:text-gray-500 light:text-gray-500" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari produk..."
                className="w-full rounded-full border border-gray-700 dark:border-white/10 bg-gray-200 dark:bg-white/[0.03] py-3 sm:py-4 pl-11 sm:pl-14 pr-12 sm:pr-14 text-[13px] sm:text-sm font-semibold text-gray-900 dark:text-white light:bg-gray-200 light:border-gray-400 placeholder:text-gray-400 dark:placeholder:text-gray-400 light:placeholder:text-gray-500 transition-all duration-300 focus:border-green-600 dark:focus:border-[#d7ff53] focus:bg-gray-300 dark:focus:bg-white/[0.06] light:focus:bg-gray-300"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Hapus pencarian"
                  className="absolute right-2.5 sm:right-3 top-1/2 flex h-7 w-7 sm:h-8 sm:w-8 -translate-y-1/2 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 light:bg-gray-200 light:text-gray-700 transition hover:bg-gray-300 dark:hover:bg-[#d7ff53]/30 hover:bg-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </button>
              )}
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className="flex items-center justify-center gap-2 sm:gap-2.5 rounded-full border border-gray-700 dark:border-white/10 bg-gray-200 dark:bg-white/[0.03] px-4 sm:px-5 py-3 sm:py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-700 dark:text-white/80 transition-all duration-300 hover:border-green-600 dark:hover:border-[#d7ff53] hover:text-green-700 dark:hover:text-[#d7ff53] md:hidden light:bg-gray-200 light:border-gray-400 light:text-gray-700"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-700 dark:text-white light:text-gray-700" />
              <span>Filter</span>
              {category !== "All" && (
                <span className="flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full bg-green-600 dark:bg-[#d7ff53] text-[8px] sm:text-[9px] font-black text-white dark:text-gray-800 light:bg-green-600 light:text-white light:dark:text-gray-800">
                  {filteredCount}
                </span>
              )}
            </button>
          </div>

          {/* ===== Category chips ===== */}
          <div
            className={`mt-3 sm:mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2 border-t border-gray-300 dark:border-white/5 pt-3 sm:pt-4 md:mt-4 md:border-t md:border-white/5 md:pt-4 ${
              filtersOpen ? "" : "hidden md:flex"
            }`}
          >
            <span className="mr-2 hidden text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 light:text-gray-400 dark:light:text-gray-500 md:block">
              Kategori
            </span>
            {categories.map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`group relative overflow-hidden rounded-full px-3 py-1.5 sm:px-5 sm:py-2.5 text-[9px] sm:text-[10px] md:text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                    active
                      ? "bg-green-600 dark:bg-[#d7ff53] text-white dark:text-gray-800 light:bg-green-600"
                      : "border border-gray-300 dark:border-white/10 bg-gray-200 dark:bg-white/[0.04] text-gray-700 dark:text-white/70 hover:border-gray-400 dark:hover:border-white/30 hover:bg-gray-300 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white light:bg-gray-200"
                  }`}
                >
                  {active && (
                    <span
                      className="absolute inset-0 -z-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      style={{
                        backgroundSize: "200% 200%",
                        animation: "shimmer 3s linear infinite",
                      }}
                    />
                  )}
                  <span className="relative flex items-center gap-1 sm:gap-1.5">
                    {active && <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                    {cat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Results meta strip ===== */}
      <section className="mx-auto max-w-7xl px-4 md:px-8">
        <div
          className="mb-6 sm:mb-8 md:mb-12 flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6"
        >
          <div>
            <div className="mb-1.5 sm:mb-2 inline-flex items-center gap-2 sm:gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-green-600 dark:text-[#d7ff53] light:text-gray-900">
              <span className="h-px w-6 sm:w-8 bg-green-600 dark:bg-[#d7ff53] light:bg-green-600" />
              Produk
              <span className="h-px w-6 sm:w-8 bg-green-600 dark:bg-[#d7ff53] light:bg-green-600" />
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-black uppercase leading-[0.92] tracking-[-0.03em] md:text-6xl text-gray-900 dark:text-white light:text-gray-900">
              Item
              <span className="ml-2 sm:ml-3 inline-block bg-gradient-to-r from-green-600 to-white/40 dark:from-[#d7ff53] dark:via-[#d7ff53] dark:to-[#d7ff53]/40 bg-clip-text text-transparent light:bg-green-600 light:from-green-600">
                Tersedia
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Active category badge (removable) */}
            {category !== "All" && (
              <button
                onClick={() => setCategory("All")}
                className="group flex items-center gap-2 rounded-full border border-green-600 dark:border-[#d7ff53]/30 bg-green-100 dark:bg-[#d7ff53]/[0.08] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-green-700 dark:text-[#d7ff53] transition-all duration-300 hover:bg-green-200 dark:hover:bg-[#d7ff53]/15"
              >
                <span>{category}</span>
                <X className="h-3 w-3 transition-transform duration-300 group-hover:rotate-90" />
              </button>
            )}
            {/* Counter with tabular nums */}
            <div className="flex items-center gap-2 rounded-full border border-gray-700 dark:border-white/10 bg-gray-200 dark:bg-white/[0.03] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 backdrop-blur md:text-xs">
              <span className="text-gray-900 dark:text-white tabular-nums">{filtered.length}</span>
              <span className="text-gray-400 dark:text-white/20">/</span>
              <span className="text-gray-500 dark:text-white/40 tabular-nums">
                {products.length}
              </span>
              <span className="text-gray-500 dark:text-white/35">Item</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Product grid ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:pb-20 md:px-8 md:pb-24">
        {filtered.length === 0 ? (
          <EmptyState onReset={() => { setCategory("All"); setQuery(""); }} />
        ) : (
          <div
            key={`${category}-${query}`}
            className="grid grid-cols-2 gap-2.5 sm:gap-6 sm:grid-cols-2 md:gap-7 lg:gap-8 lg:grid-cols-3"
          >
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ============================================================ */
/*  Empty state cinematic component                              */
/* ============================================================ */

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div
      className="relative mx-auto max-w-2xl overflow-hidden rounded-[2.5rem] border border-gray-300 dark:border-white/10 bg-gray-100 dark:bg-white/[0.02] p-12 text-center backdrop-blur md:p-16 light:bg-gray-100 light:border-gray-300"
      style={{
        animation: "fade-up 700ms cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
    >
      {/* Decorative backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[80%] w-[80%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,_rgba(215,255,83,0.12),_transparent_55%)]" />
        <div className="absolute inset-0 bg-grid-fade [background-size:48px_48px] opacity-[0.25]" />
      </div>

      {/* Icon container with pulse ring */}
      <div className="relative mx-auto mb-8 flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 -z-10 rounded-full bg-green-600/20 dark:bg-[#d7ff53]/20 blur-xl" />
        <div className="absolute inset-0 -z-10 rounded-full border border-green-600/30 dark:border-[#d7ff53]/30" />
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gray-300 dark:border-white/10 bg-gray-100 dark:bg-white/[0.04] light:bg-gray-100">
          <Search className="h-8 w-8 text-gray-500 dark:text-white/40 light:text-gray-500" />
        </div>
      </div>

      <h3 className="font-display text-3xl font-black uppercase tracking-tight md:text-4xl">
        Produk Tidak Ditemukan
      </h3>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-gray-600 dark:text-gray-300 light:text-gray-600">
        Coba ubah kata pencarian atau kategori produk untuk menemukan
        merchandise yang kamu cari.
      </p>
      <button
        onClick={onReset}
        className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-green-600 dark:bg-[#d7ff53] px-7 py-3.5 text-xs font-black uppercase tracking-widest text-white dark:text-gray-800 transition-transform duration-300 hover:scale-[1.05] md:px-8 light:bg-green-600 light:text-white"
      >
        <X className="h-3.5 w-3.5 text-white dark:text-gray-800 light:text-white" />
        Reset Filter
      </button>
    </div>
  );
}