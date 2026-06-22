"use client";

import { useState } from "react";
import Link from "next/link";
import { PackageSearch, SlidersHorizontal, LayoutGrid, List } from "lucide-react";
import ProductCardV2 from "./ProductCardV2";
import QuickViewModal from "./QuickViewModal";
import { rupiah } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  description?: string | null;
  category?: string | null;
  product_images: { image_url: string; sort_order: number }[];
  product_variants: { id: string; size: string; color: string | null; stock: number }[];
};

type ProductGridProps = {
  products: Product[];
  defaultView?: "grid" | "list";
};

export default function ProductGrid({ products }: ProductGridProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Empty state
  if (!products || products.length === 0) {
    return (
      <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-10 text-center md:p-16">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
          <PackageSearch size={32} className="text-white/40" />
        </div>
        <h3 className="text-2xl font-black uppercase md:text-3xl">
          Produk Tidak Ditemukan
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/55 md:text-base">
          Coba ubah kata pencarian atau pilih kategori lain untuk menemukan
          merchandise yang kamu cari.
        </p>
        <Link
          href="/products"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#d7ff53] px-7 py-3.5 text-sm font-black uppercase tracking-wider text-black transition hover:scale-105 hover:bg-white"
        >
          <SlidersHorizontal size={14} />
          Reset Filter
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Result bar */}
      <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <p className="text-xs font-bold text-white/55 md:text-sm">
          Menampilkan <span className="font-black text-[#d7ff53]">{products.length}</span> produk
        </p>

        <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1 md:flex">
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-label="Grid view"
            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
              view === "grid"
                ? "bg-[#d7ff53] text-black"
                : "text-white/55 hover:text-white"
            }`}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            aria-label="List view"
            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
              view === "list"
                ? "bg-[#d7ff53] text-black"
                : "text-white/55 hover:text-white"
            }`}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Grid or List view */}
      {view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:gap-6">
          {products.map((product, idx) => (
            <ProductCardV2
              key={product.id}
              product={product}
              index={idx}
              onQuickView={setQuickViewProduct}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product, idx) => (
            <ProductListItem
              key={product.id}
              product={product}
              index={idx}
              onQuickView={setQuickViewProduct}
            />
          ))}
        </div>
      )}

      {/* Quick view modal */}
      <QuickViewModal
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        product={quickViewProduct}
      />
    </>
  );
}

function ProductListItem({
  product,
  index,
  onQuickView,
}: {
  product: Product;
  index: number;
  onQuickView: (p: Product) => void;
}) {
  const images = product.product_images?.filter((img) => img.image_url) || [];
  const mainImage = images[0]?.image_url || "https://via.placeholder.com/400";
  const variants = product.product_variants || [];
  const totalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
  const isComingSoon = product.category === "Coming Soon" || product.price === 0;
  const isSoldOut = totalStock <= 0 && !isComingSoon;
  const availableSizes = variants.filter((v) => Number(v.stock) > 0);

  return (
    <div
      className="group flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d7ff53]/30 hover:bg-white/[0.06] sm:flex-row sm:items-stretch"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Image */}
      <Link
        href={isComingSoon ? "/products" : `/products/${product.slug}`}
        className="relative block aspect-square w-full overflow-hidden rounded-xl bg-white/5 sm:h-32 sm:w-32"
      >
        <img
          src={mainImage}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110 group-hover:grayscale-0 grayscale-[40%]"
        />
      </Link>

      {/* Detail */}
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {product.category && (
              <span className="rounded-full bg-[#d7ff53] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-black">
                {product.category}
              </span>
            )}
            {isSoldOut && (
              <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                Stok Habis
              </span>
            )}
          </div>
          <h3 className="line-clamp-1 text-lg font-black uppercase text-white transition group-hover:text-[#d7ff53]">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-1 line-clamp-1 text-xs text-white/55">
              {product.description}
            </p>
          )}
          <div className="mt-2 hidden flex-wrap gap-1.5 sm:flex">
            {availableSizes.slice(0, 6).map((variant) => (
              <span
                key={variant.id}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-black text-white/70"
              >
                {variant.size}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 sm:flex-col sm:items-end sm:text-right">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">
              {isComingSoon ? "Status" : "Harga"}
            </p>
            <p className="text-xl font-black text-white">
              {isComingSoon ? "Coming Soon" : rupiah(product.price)}
            </p>
            <p
              className={`text-[10px] font-black ${
                totalStock > 0 ? "text-[#d7ff53]" : "text-red-400"
              }`}
            >
              {isComingSoon ? "—" : totalStock > 0 ? `${totalStock} pcs` : "Habis"}
            </p>
          </div>
          <div className="flex gap-2">
            {onQuickView && !isComingSoon && (
              <button
                type="button"
                onClick={() => onQuickView(product)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white/75 transition hover:border-[#d7ff53] hover:text-[#d7ff53]"
              >
                Quick
              </button>
            )}
            <Link
              href={isComingSoon ? "/products" : `/products/${product.slug}`}
              className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-wider transition ${
                isComingSoon
                  ? "border border-white/10 bg-white/5 text-white/55"
                  : isSoldOut
                  ? "border border-red-400/30 bg-red-500/10 text-red-300"
                  : "bg-[#d7ff53] text-black hover:bg-white"
              }`}
            >
              {isComingSoon ? "Soon" : isSoldOut ? "Habis" : "Lihat"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
