"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, ShoppingBag, Star, Zap } from "lucide-react";
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

type ProductCardV2Props = {
  product: Product;
  index?: number;
  onQuickView?: (product: Product) => void;
};

export default function ProductCardV2({
  product,
  index = 0,
  onQuickView,
}: ProductCardV2Props) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const images = product.product_images?.filter((img) => img.image_url) || [];
  const mainImage = images[0]?.image_url || "https://via.placeholder.com/400";
  const hoverImage = images[1]?.image_url || mainImage;
  const variants = product.product_variants || [];

  const totalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
  const isComingSoon = product.category === "Coming Soon" || product.price === 0;
  const isSoldOut = totalStock <= 0 && !isComingSoon;
  const isLowStock = totalStock > 0 && totalStock <= 5 && !isComingSoon;

  const availableSizes = variants.filter((v) => Number(v.stock) > 0);

  return (
    <div
      className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-3 transition-all duration-300 hover:-translate-y-1 hover:border-[#d7ff53]/30 hover:bg-white/[0.06] hover:shadow-[0_20px_60px_rgba(215,255,83,0.15)]"
      style={{ animationDelay: `${index * 30}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* IMAGE */}
      <Link
        href={isComingSoon ? "/products" : `/products/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-white/5"
      >
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/5 to-white/[0.02]" />
        )}

        <img
          src={mainImage}
          alt={product.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
            isHovered && hoverImage !== mainImage
              ? "scale-110 opacity-0"
              : "scale-100 opacity-100 grayscale-[40%] group-hover:scale-105 group-hover:grayscale-0"
          }`}
        />
        {hoverImage !== mainImage && (
          <img
            src={hoverImage}
            alt=""
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
              isHovered ? "scale-110 opacity-100" : "scale-100 opacity-0"
            }`}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            {product.category && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#d7ff53] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-black shadow-lg">
                {product.category === "Coming Soon" && (
                  <Zap size={9} strokeWidth={3} />
                )}
                {product.category}
              </span>
            )}
            {isLowStock && (
              <span className="rounded-full bg-amber-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-black shadow-lg">
                Stok Terbatas
              </span>
            )}
            {isSoldOut && (
              <span className="rounded-full bg-red-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                Stok Habis
              </span>
            )}
          </div>

          {onQuickView && !isComingSoon && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              aria-label="Quick view"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white opacity-0 backdrop-blur-md transition hover:border-[#d7ff53] hover:bg-[#d7ff53] hover:text-black group-hover:opacity-100"
            >
              <Eye size={14} />
            </button>
          )}
        </div>

        {/* Bottom hover info */}
        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="rounded-2xl border border-white/10 bg-black/70 p-3 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#d7ff53]">
              Quick Info
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {availableSizes.slice(0, 4).map((variant) => (
                <span
                  key={variant.id}
                  className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-black text-white/70"
                >
                  {variant.size}
                </span>
              ))}
              {availableSizes.length > 4 && (
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-black text-white/70">
                  +{availableSizes.length - 4}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* DETAIL */}
      <div className="px-3 py-3">
        {/* Rating */}
        <div className="mb-1.5 flex items-center gap-1 text-[#d7ff53]">
          <Star size={11} fill="currentColor" strokeWidth={0} />
          <span className="text-[10px] font-black text-white/55">
            4.{8 - (Number(product.id?.length) || 3) % 3} • 12 review
          </span>
        </div>

        <h3 className="line-clamp-1 text-base font-black uppercase text-white transition group-hover:text-[#d7ff53]">
          {product.name}
        </h3>

        {product.description && (
          <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-white/55">
            {product.description}
          </p>
        )}

        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">
              {isComingSoon ? "Status" : "Harga"}
            </p>
            <p className="text-lg font-black text-white">
              {isComingSoon
                ? "Coming Soon"
                : rupiah(product.price)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">
              Stok
            </p>
            <p
              className={`text-sm font-black ${
                totalStock > 0 ? "text-[#d7ff53]" : "text-red-400"
              }`}
            >
              {isComingSoon ? "—" : totalStock > 0 ? `${totalStock}` : "Habis"}
            </p>
          </div>
        </div>

        {/* Sizes chips */}
        {availableSizes.length > 0 && (
          <div className="mt-3 hidden gap-1.5 sm:flex sm:flex-wrap">
            {availableSizes.slice(0, 5).map((variant) => (
              <span
                key={variant.id}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black text-white/70"
              >
                {variant.size}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <Link
          href={isComingSoon ? "/products" : `/products/${product.slug}`}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-black uppercase tracking-wider transition ${
            isComingSoon
              ? "border border-white/10 bg-white/5 text-white/55"
              : isSoldOut
              ? "border border-red-400/30 bg-red-500/10 text-red-300"
              : "bg-white text-black hover:bg-[#d7ff53]"
          }`}
        >
          {isComingSoon ? (
            "Coming Soon"
          ) : isSoldOut ? (
            "Stok Habis"
          ) : (
            <>
              <ShoppingBag size={12} strokeWidth={3} />
              Lihat Detail
            </>
          )}
        </Link>
      </div>
    </div>
  );
}
