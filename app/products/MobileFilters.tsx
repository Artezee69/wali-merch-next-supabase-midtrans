"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Filter, Search, X, Check } from "lucide-react";

type MobileFiltersProps = {
  categories: string[];
  selectedCategory: string;
  currentQuery: string;
};

export default function MobileFilters({
  categories,
  selectedCategory,
  currentQuery,
}: MobileFiltersProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(currentQuery);
  const [tempCategory, setTempCategory] = useState(selectedCategory);

  function applyFilters() {
    const params = new URLSearchParams();
    if (searchInput.trim()) params.set("q", searchInput.trim());
    if (tempCategory && tempCategory !== "All") {
      params.set("category", tempCategory);
    }
    const queryString = params.toString();
    router.push(`/products${queryString ? `?${queryString}` : ""}`);
    setOpen(false);
  }

  return (
    <>
      {/* Mobile search + filter button */}
      <div className="flex gap-2 md:hidden">
        <form
          action="/products"
          method="GET"
          className="relative flex-1"
        >
          <Search
            size={14}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            name="q"
            defaultValue={currentQuery}
            placeholder="Cari produk..."
            className="w-full rounded-full border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-xs font-semibold text-white outline-none placeholder:text-white/35 focus:border-[#d7ff53]"
          />
          {selectedCategory !== "All" && (
            <input
              type="hidden"
              name="category"
              value={selectedCategory}
            />
          )}
        </form>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black uppercase tracking-wider text-white transition active:scale-95"
        >
          <Filter size={14} />
          Filter
          {selectedCategory !== "All" && (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#d7ff53] ring-2 ring-[#0b0b0b]" />
          )}
        </button>
      </div>

      {/* Filter modal */}
      {open && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md md:hidden">
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#0b0b0b]">
            {/* Drag handle */}
            <div className="sticky top-0 z-10 bg-[#0b0b0b]">
              <div className="flex justify-center pt-3 pb-2">
                <div className="h-1 w-10 rounded-full bg-white/20" />
              </div>

              <div className="flex items-center justify-between px-5 pb-3">
                <div>
                  <h2 className="text-base font-black uppercase">Filter</h2>
                  <p className="text-[10px] text-white/50">
                    Sesuaikan pencarian kamu
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-[#d7ff53] hover:text-[#d7ff53]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-5 px-5 pb-5">
              {/* Search */}
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-white/40">
                  Cari
                </label>
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                  />
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Cari produk..."
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-[#d7ff53]"
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-white/40">
                  Kategori
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const active = tempCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setTempCategory(category)}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-black uppercase transition ${
                          active
                            ? "bg-[#d7ff53] text-black"
                            : "border border-white/10 bg-white/5 text-white/70"
                        }`}
                      >
                        {active && <Check size={11} strokeWidth={3} />}
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Apply button */}
            <div className="sticky bottom-0 border-t border-white/10 bg-[#0b0b0b] p-5">
              <div className="flex gap-2">
                <Link
                  href="/products"
                  onClick={() => setOpen(false)}
                  className="flex flex-1 items-center justify-center rounded-full border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-wider text-white/70 transition hover:border-white hover:text-white"
                >
                  Reset
                </Link>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="flex-1 rounded-full bg-[#d7ff53] px-5 py-3 text-xs font-black uppercase tracking-wider text-black transition hover:bg-white"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}