"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { rupiah } from "@/lib/format";

type Variant = {
  id?: string;
  size: string;
  stock: number;
  price?: number | null;
  sale_price?: number | null;
};

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    base_price?: number | null;
    sale_price?: number | null;
    category?: string | null;
    description?: string | null;
    product_images?: { image_url: string }[] | null;
    product_variants?: Variant[] | null;
    soldCount?: number;
    rating?: {
      avg: number;
      count: number;
    };
  };
  index?: number;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523398002811-999ca8dec234?q=80&w=1200&auto=format&fit=crop";

function getTotalStock(product: ProductCardProps["product"]): number {
  return (
    product.product_variants?.reduce(
      (total, v) => total + Number(v.stock || 0),
      0
    ) || 0
  );
}

function getImage(product: ProductCardProps["product"]): string {
  return product.product_images?.[0]?.image_url || FALLBACK_IMAGE;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const totalStock = getTotalStock(product);
  const isComingSoon = product.category === "Coming Soon" || product.price === 0;
  const isSoldOut = totalStock <= 0 && !isComingSoon;
  const isTerlaris = (product.soldCount ?? 0) >= 100;

  // Determine effective price and discount
  const productBase = Number(product.base_price ?? product.price ?? 0);
  const productSale = product.sale_price != null ? Number(product.sale_price) : 0;

  // Also check variant-level: any variant with sale_price set and lower than productBase
  let variantSale = 0;
  if (product.product_variants) {
    for (const v of product.product_variants) {
      const vs = v.sale_price != null ? Number(v.sale_price) : 0;
      if (vs > 0 && vs < productBase) {
        variantSale = vs;
        break;
      }
    }
  }

  const salePrice = productSale > 0 ? productSale : variantSale;
  const hasDiscount = salePrice > 0 && productBase > salePrice;
  const basePrice = productBase;

  let discountPercent = 0;
  if (hasDiscount && basePrice > 0) {
    discountPercent = Math.round(((basePrice - salePrice) / basePrice) * 100);
  }

  const soldCount = product.soldCount ?? 0;
  const rating = product.rating;
  const hasRating = rating && typeof rating.avg === "number" && rating.count > 0;

  const href = isComingSoon ? "/products" : `/products/${product.slug}`;

  return (
    <Link
      href={href}
      className="group relative block rounded-2xl border border-white/[0.08] bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-color)]/40 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-[#0d0d0d]">
        <Image
          src={getImage(product)}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
          decoding="async"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1.5">
          {hasDiscount && (
            <span className="rounded-md bg-[var(--danger-color)] px-2 py-0.5 text-[11px] font-extrabold tracking-tight text-white shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {isTerlaris && !isSoldOut && (
            <span className="rounded-md bg-[var(--accent-color)] px-2 py-0.5 text-[11px] font-extrabold tracking-tight text-black shadow-sm">
              Terlaris
            </span>
          )}
          {isComingSoon && !hasDiscount && !isTerlaris && (
            <span className="rounded-md border border-white/20 bg-black/40 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-md">
              Baru
            </span>
          )}
          {isSoldOut && (
            <span className="rounded-md bg-neutral-700 px-2 py-0.5 text-[11px] font-bold text-white/80 shadow-sm">
              Habis
            </span>
          )}
        </div>

        {/* Category tag — subtle, bottom-left */}
        {!isComingSoon && product.category && product.category !== "All" && (
          <div className="absolute bottom-3 left-3 z-10">
            <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/80 backdrop-blur-sm">
              {product.category}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        {/* Product name */}
        <h3
          className="line-clamp-1 text-sm font-semibold tracking-tight transition-colors duration-200 group-hover:text-[var(--accent-color)]"
          style={{ color: "var(--text-primary)" }}
        >
          {product.name}
        </h3>

        {/* Price row */}
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          {isComingSoon ? (
            <span className="text-sm font-semibold text-white/50">
              Segera Hadir
            </span>
          ) : hasDiscount ? (
            <>
              <span className="text-base font-bold text-[var(--accent-color)] sm:text-lg">
                {rupiah(salePrice)}
              </span>
              <span className="text-xs font-medium text-white/40 line-through">
                {rupiah(basePrice)}
              </span>
            </>
          ) : (
            <span
              className="text-base font-bold sm:text-lg"
              style={{ color: "var(--text-primary)" }}
            >
              {rupiah(basePrice)}
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
          {hasRating && rating ? (
            <div className="flex items-center gap-1">
              <Star
                size={11}
                fill="var(--accent-color)"
                stroke="var(--accent-color)"
                strokeWidth={1}
              />
              <span className="text-[11px] font-medium text-white/50">
                {rating.avg.toFixed(1)}
              </span>
            </div>
          ) : (
            <span />
          )}
          {soldCount > 0 && (
            <span className="text-[11px] font-semibold text-white/40">
              {soldCount} terjual
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}