"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { Search, SlidersHorizontal, ChevronDown, X } from "lucide-react";

type Category = {
  name: string;
  count: number;
};

type ProductFilterBarProps = {
  categories: Category[];
  totalProducts: number;
  initialQuery: string;
  initialCategory: string;
  initialSort: string;
};

const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "popular", label: "Paling Laris" },
  { value: "price-asc", label: "Harga Terendah" },
  { value: "price-desc", label: "Harga Tertinggi" },
  { value: "name-asc", label: "Nama A-Z" },
  { value: "name-desc", label: "Nama Z-A" },
];

export default function ProductFilterBar({
  categories,
  totalProducts,
  initialQuery,
  initialCategory,
  initialSort,
}: ProductFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(initialQuery);
  const [showSort, setShowSort] = useState(false);
  const [showCatMobile, setShowCatMobile] = useState(false);

  // Sync query state when URL changes (e.g. when user clicks a category)
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  function buildHref(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "All" || value === "newest") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function update(updates: Record<string, string | null>) {
    startTransition(() => {
      router.push(buildHref(updates), { scroll: false });
    });
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    update({ q: query || null });
  }

  function clearFilters() {
    setQuery("");
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }

  const hasActiveFilter =
    (initialQuery && initialQuery.length > 0) ||
    (initialCategory && initialCategory !== "All") ||
    (initialSort && initialSort !== "newest");

  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.value === initialSort)?.label || "Terbaru";

  return (
    <div
      className={`space-y-4 transition-opacity ${
        isPending ? "pointer-events-none opacity-50" : ""
      }`}
    >
      {/* Top row: search + sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-black/40 pl-5 pr-2 py-2 transition focus-within:border-[#d7ff53]"
        >
          <Search size={16} className="shrink-0 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari produk, kategori, atau koleksi..."
            className="flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                update({ q: null });
              }}
              aria-label="Clear search"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="submit"
            className="rounded-full bg-[#d7ff53] px-5 py-2 text-xs font-black uppercase tracking-wider text-black transition hover:bg-white"
          >
            Cari
          </button>
        </form>

        {/* Sort dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowSort((s) => !s)}
            className="flex w-full items-center justify-between gap-2 rounded-full border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-[#d7ff53] sm:w-auto"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal size={14} />
              <span className="text-white/50">Sort:</span>
              <span className="font-black">{currentSortLabel}</span>
            </span>
            <ChevronDown
              size={14}
              className={`transition ${showSort ? "rotate-180" : ""}`}
            />
          </button>

          {showSort && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSort(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0b] shadow-2xl">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      update({ sort: option.value === "newest" ? null : option.value });
                      setShowSort(false);
                    }}
                    className={`block w-full px-5 py-3 text-left text-sm font-bold transition ${
                      initialSort === option.value
                        ? "bg-[#d7ff53] text-black"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Mobile category toggle */}
        <button
          type="button"
          onClick={() => setShowCatMobile((s) => !s)}
          className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-[#d7ff53] lg:hidden"
        >
          <SlidersHorizontal size={14} />
          Kategori
        </button>
      </div>

      {/* Category pills (desktop always shown, mobile via showCatMobile) */}
      <div
        className={`flex flex-wrap items-center gap-2 ${
          showCatMobile ? "block" : "hidden lg:flex"
        }`}
      >
        <button
          type="button"
          onClick={() => update({ category: null })}
          className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider transition md:px-5 md:py-2.5 ${
            initialCategory === "All"
              ? "bg-[#d7ff53] text-black"
              : "border border-white/10 bg-white/5 text-white/70 hover:bg-white hover:text-black"
          }`}
        >
          Semua ({totalProducts})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.name}
            type="button"
            onClick={() => update({ category: cat.name })}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider transition md:px-5 md:py-2.5 ${
              initialCategory === cat.name
                ? "bg-[#d7ff53] text-black"
                : "border border-white/10 bg-white/5 text-white/70 hover:bg-white hover:text-black"
            }`}
          >
            {cat.name}
            <span
              className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                initialCategory === cat.name
                  ? "bg-black/15 text-black"
                  : "bg-white/10 text-white/55"
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}

        {hasActiveFilter && (
          <button
            type="button"
            onClick={clearFilters}
            className="ml-auto flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-red-300 transition hover:bg-red-500 hover:text-white"
          >
            <X size={12} />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
