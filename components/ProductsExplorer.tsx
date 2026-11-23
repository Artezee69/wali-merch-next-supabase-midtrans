"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";

type Variant = { id?: string; size: string; stock: number; price?: number | null; sale_price?: number | null };

export type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  base_price?: number | null;
  sale_price?: number | null;
  soldCount?: number;
  rating?: {
    avg: number;
    count: number;
  };
  category?: string | null;
  description?: string | null;
  product_images?: { image_url: string }[] | null;
  product_variants?: Variant[] | null;
};

const PAGE_SIZE = 12;

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
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return products.filter((product) => {
      const matchSearch =
        !q ||
        product.name?.toLowerCase().includes(q) ||
        product.description?.toLowerCase().includes(q) ||
        product.category?.toLowerCase().includes(q);
      const matchCategory = category === "All" || product.category === category;
      return matchSearch && matchCategory;
    });
  }, [products, query, category]);

  const visible = useMemo(
    () => filtered.slice(0, page * PAGE_SIZE),
    [filtered, page]
  );

  const hasMore = visible.length < filtered.length;

  return (
    <div className="relative min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* ===== Page header ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:pt-14 md:px-8">
        {/* Title */}
        <div className="mb-8 sm:mb-10">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">
            WALI Merch
          </p>
          <div className="relative inline-block">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Semua Produk
            </h1>
            {/* Accent underline */}
            <div
              className="absolute -bottom-2 left-0 h-[2px] w-24 rounded-full sm:w-32"
              style={{ background: "var(--accent-color)" }}
            />
          </div>
          <p className="mt-6 max-w-lg text-sm leading-relaxed text-white/40">
            Koleksi merchandise resmi WALI. Pilih kategori, cari, atau jelajahi semua yang tersedia.
          </p>
        </div>

        {/* Search + Categories */}
        <div className="mb-8 space-y-5 sm:mb-12">
          {/* Search bar */}
          <div className="relative">
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4 text-white/30" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cari produk..."
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3.5 pl-11 pr-12 text-sm font-medium text-white outline-none transition-all duration-200 placeholder:text-white/25 focus:border-[var(--accent-color)]/50 focus:ring-2 focus:ring-[var(--accent-color)]/10"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Hapus pencarian"
                className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-white/30 transition-colors duration-150 hover:bg-white/10 hover:text-white/60"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setPage(1);
                  }}
                  className={
                    active
                      ? "rounded-full bg-[var(--accent-color)] px-4 py-2 text-[11px] font-bold text-black transition-colors duration-200 sm:px-5 sm:py-2.5 sm:text-xs"
                      : "rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[11px] font-bold text-white/40 transition-all duration-200 hover:border-white/[0.15] hover:text-white/70 sm:px-5 sm:py-2.5 sm:text-xs"
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Results bar ===== */}
      <section className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-6 flex items-center justify-between sm:mb-8">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-white/30">
              {filtered.length} produk
            </span>
            {category !== "All" && (
              <button
                onClick={() => {
                  setCategory("All");
                  setPage(1);
                }}
                className="group flex items-center gap-1.5 rounded-full border border-white/[0.08] px-3 py-1 text-[11px] font-medium text-white/50 transition-colors duration-200 hover:border-white/[0.2] hover:text-white"
              >
                <span>{category}</span>
                <X className="h-3 w-3 transition-colors group-hover:text-white" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ===== Product grid ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:pb-20 md:px-8 md:pb-28">
        {filtered.length === 0 ? (
          <EmptyState onReset={() => { setCategory("All"); setQuery(""); setPage(1); }} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white/60 transition-all duration-200 hover:border-white/[0.2] hover:bg-white/[0.06] hover:text-white"
            >
              Muat Lebih Banyak
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

/* ============================================================ */
/*  Empty state                                                  */
/* ============================================================ */

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-white/[0.06] bg-white/[0.02] px-8 py-16 text-center sm:px-12">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
        <Search className="h-5 w-5 text-white/25" />
      </div>
      <h3 className="text-base font-semibold text-white/80">
        Tidak ada produk ditemukan
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-white/35">
        Coba ubah kata kunci pencarian atau pilih kategori lain.
      </p>
      <button
        onClick={onReset}
        className="mt-6 rounded-lg bg-[var(--accent-color)] px-5 py-2.5 text-xs font-bold text-black transition-transform duration-150 active:scale-[0.97]"
      >
        Reset Filter
      </button>
    </div>
  );
}