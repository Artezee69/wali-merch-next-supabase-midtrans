"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowUpDown, X, Sparkles } from "lucide-react";
import ProductCard from "@/components/ProductCard";

type Variant = { id?: string; size: string; stock: number };

export type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  category?: string | null;
  description?: string | null;
  product_images?: { image_url: string }[] | null;
  product_variants?: Variant[] | null;
};

type SortKey = "newest" | "price-asc" | "price-desc" | "name-asc";

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
  const [sort, setSort] = useState<SortKey>("newest");
  const [mounted, setMounted] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = products.filter((product) => {
      const matchSearch =
        !q ||
        product.name?.toLowerCase().includes(q) ||
        product.description?.toLowerCase().includes(q) ||
        product.category?.toLowerCase().includes(q);

      const matchCategory =
        category === "All" || product.category === category;

      return matchSearch && matchCategory;
    });

    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        list = [...list].sort((a, b) =>
          a.name.localeCompare(b.name, "id", { sensitivity: "base" })
        );
        break;
      case "newest":
      default:
        break;
    }
    return list;
  }, [products, query, category, sort]);

  const sortLabels: Record<SortKey, string> = {
    newest: "Newest First",
    "price-asc": "Price · Low → High",
    "price-desc": "Price · High → Low",
    "name-asc": "Name · A → Z",
  };

  return (
    <div className="relative min-h-screen">
      {/* ===== Ambient stage lighting ===== */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[120%] w-[140%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center_top,_rgba(215,255,83,0.15),_transparent_55%)]" />
        <div
          className="absolute left-[5%] top-[25%] h-[30vw] w-[30vw] rounded-full bg-[#5e8bff]/8 blur-[150px] animate-aurora-2"
          style={{ filter: "blur(150px)" }}
        />
        <div
          className="absolute right-[5%] bottom-[25%] h-[30vw] w-[30vw] rounded-full bg-[#ff5edb]/8 blur-[150px] animate-aurora-1"
          style={{ filter: "blur(150px)" }}
        />
        <div className="absolute inset-0 bg-grid-fade [background-size:64px_64px] opacity-[0.18]" />
        {/* Floor line */}
        <div className="absolute bottom-[180px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>

      {/* ===== Toolbar section ===== */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <div
          className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-4 backdrop-blur-md md:p-5"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(30px)",
            transition: "all 900ms cubic-bezier(0.16, 1, 0.3, 1) 150ms",
          }}
        >
          {/* Subtle inner glow on hover */}
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-[2.5rem] bg-gradient-to-br from-white/[0.02] via-transparent to-white/[0.02]" />

          {/* ===== Top row: search + sort + filter toggle ===== */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
            {/* Search input with icon and clear button */}
            <div className="relative flex-1">
              <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/40">
                <Search className="h-4.5 w-4.5" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari produk, kategori, atau koleksi..."
                className="w-full rounded-full border border-white/10 bg-black/40 py-4 pl-14 pr-14 text-sm font-semibold text-white outline-none placeholder:text-white/35 transition-all duration-300 focus:border-[#d7ff53]/50 focus:bg-black/50 md:py-4.5"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort dropdown with icon */}
            <div className="relative">
              <button
                onClick={() => setSortOpen((o) => !o)}
                className="group flex w-full items-center justify-between gap-3 rounded-full border border-white/10 bg-white/[0.03] px-6 py-4 text-xs font-black uppercase tracking-widest text-white/80 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] md:w-auto"
              >
                <span className="flex items-center gap-2.5">
                  <ArrowUpDown className="h-4 w-4" />
                  <span className="text-white/35">Sort:</span>
                  <span className="text-white">{sortLabels[sort]}</span>
                </span>
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[#d7ff53] transition-transform duration-300"
                  style={{
                    transform: sortOpen ? "rotate(45deg) scale(1.25)" : "scale(1)",
                  }}
                />
              </button>
              {sortOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setSortOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-full z-40 mt-3 w-64 overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0b]/98 p-2 shadow-2xl backdrop-blur-2xl"
                    style={{
                      animation: "fade-up 300ms cubic-bezier(0.16, 1, 0.3, 1) both",
                    }}
                  >
                    <div className="mb-2 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white/35">
                      Order By
                    </div>
                    {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSort(key);
                          setSortOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                          sort === key
                            ? "bg-[#d7ff53]/10 text-[#d7ff53]"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span>{sortLabels[key]}</span>
                        {sort === key && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#d7ff53]" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className="flex items-center justify-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-5 py-4 text-xs font-black uppercase tracking-widest text-white/80 backdrop-blur-md transition-all duration-300 hover:border-[#d7ff53] hover:text-[#d7ff53] md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filter</span>
              {category !== "All" && (
                <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#d7ff53] text-[9px] font-black text-black">
                  1
                </span>
              )}
            </button>
          </div>

          {/* ===== Category chips ===== */}
          <div
            className={`mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4 md:mt-4 md:border-t md:border-white/5 md:pt-4 ${
              filtersOpen ? "" : "hidden md:flex"
            }`}
          >
            <span className="mr-2 hidden text-[10px] font-bold uppercase tracking-widest text-white/35 md:block">
              Category
            </span>
            {categories.map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`group relative overflow-hidden rounded-full px-5 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all duration-300 md:px-6 md:text-[11px] ${
                    active
                      ? "bg-[#d7ff53] text-black shadow-[0_0_20px_-4px_rgba(215,255,83,0.4)]"
                      : "border border-white/10 bg-white/[0.04] text-white/70 hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
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
                  <span className="relative flex items-center gap-1.5">
                    {active && <Sparkles className="h-3 w-3" />}
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
          className="mb-8 flex flex-col gap-3 md:mb-12 md:flex-row md:items-end md:justify-between md:gap-6"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(24px)",
            transition: "all 900ms cubic-bezier(0.16, 1, 0.3, 1) 300ms",
          }}
        >
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-[#d7ff53]">
              <span className="h-px w-8 bg-[#d7ff53]" />
              Products
              <span className="h-px w-8 bg-[#d7ff53]" />
            </div>
            <h2 className="font-display text-4xl font-black uppercase leading-[0.92] tracking-[-0.03em] md:text-6xl">
              Available
              <span className="ml-3 inline-block bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
                Items
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Active category badge (removable) */}
            {category !== "All" && (
              <button
                onClick={() => setCategory("All")}
                className="group flex items-center gap-2 rounded-full border border-[#d7ff53]/30 bg-[#d7ff53]/[0.08] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#d7ff53] transition-all duration-300 hover:bg-[#d7ff53]/15"
              >
                <span>{category}</span>
                <X className="h-3 w-3 transition-transform duration-300 group-hover:rotate-90" />
              </button>
            )}
            {/* Counter with tabular nums */}
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white/55 backdrop-blur-md md:text-xs">
              <span className="text-white tabular-nums">{filtered.length}</span>
              <span className="text-white/20">/</span>
              <span className="text-white/40 tabular-nums">
                {products.length}
              </span>
              <span className="text-white/35">Items</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Product grid ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8 md:pb-24">
        {filtered.length === 0 ? (
          <EmptyState onReset={() => { setCategory("All"); setQuery(""); }} />
        ) : (
          <div
            key={`${category}-${query}-${sort}`}
            className="grid gap-6 sm:grid-cols-2 md:gap-7 lg:gap-8 lg:grid-cols-3"
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
      className="relative mx-auto max-w-2xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur-md md:p-16"
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
        <div className="absolute inset-0 -z-10 rounded-full bg-[#d7ff53]/20 blur-xl" />
        <div className="absolute inset-0 -z-10 rounded-full border border-[#d7ff53]/30" />
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
          <Search className="h-8 w-8 text-white/40" />
        </div>
      </div>

      <h3 className="font-display text-3xl font-black uppercase tracking-tight md:text-4xl">
        Produk Tidak Ditemukan
      </h3>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/55">
        Coba ubah kata pencarian atau kategori produk untuk menemukan
        merchandise yang kamu cari.
      </p>
      <button
        onClick={onReset}
        className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-[#d7ff53] px-7 py-3.5 text-xs font-black uppercase tracking-widest text-black transition-transform duration-300 hover:scale-[1.05] md:px-8"
      >
        <X className="h-3.5 w-3.5" />
        Reset Filter
      </button>
    </div>
  );
}