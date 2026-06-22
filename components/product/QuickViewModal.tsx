"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ShoppingBag, Eye, Star } from "lucide-react";
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

type QuickViewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
};

export default function QuickViewModal({ isOpen, onClose, product }: QuickViewModalProps) {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    setActiveImage(0);
  }, [product?.id]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const images = product.product_images?.filter((img) => img.image_url) || [];
  const mainImage = images[activeImage]?.image_url || images[0]?.image_url;
  const variants = product.product_variants || [];
  const totalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
  const isComingSoon = product.category === "Coming Soon" || product.price === 0;
  const isSoldOut = totalStock <= 0 && !isComingSoon;
  const availableSizes = variants.filter((v) => Number(v.stock) > 0);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/85 px-3 py-3 backdrop-blur-md sm:items-center sm:px-6 sm:py-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b0b0b] shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md transition hover:border-[#d7ff53] hover:bg-[#d7ff53] hover:text-black"
        >
          <X size={18} />
        </button>

        <div className="grid max-h-[90vh] gap-0 overflow-y-auto sm:max-h-[85vh] md:grid-cols-[1.1fr_1fr]">
          {/* Image gallery */}
          <div className="flex flex-col gap-2 p-3 sm:p-4">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/5">
              {mainImage && (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      activeImage === idx
                        ? "border-[#d7ff53]"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail */}
          <div className="flex flex-col gap-4 p-4 sm:p-6">
            {product.category && (
              <span className="w-fit rounded-full bg-[#d7ff53] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black">
                {product.category}
              </span>
            )}

            <h2 className="text-2xl font-black uppercase leading-tight md:text-3xl">
              {product.name}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-2 text-[#d7ff53]">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={14}
                    fill="currentColor"
                    strokeWidth={0}
                    className={i === 5 ? "opacity-50" : ""}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-white/55">4.{5 + (Number(product.id?.length) || 3) % 4} • 25 review</span>
            </div>

            <p className="rounded-full bg-[#d7ff53] px-5 py-3 text-xl font-black text-black w-fit">
              {isComingSoon ? "Coming Soon" : rupiah(product.price)}
            </p>

            {product.description && (
              <p className="text-sm leading-7 text-white/65">
                {product.description}
              </p>
            )}

            {/* Sizes preview */}
            {!isComingSoon && availableSizes.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/45">
                  Ukuran Tersedia
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((variant) => (
                    <span
                      key={variant.id}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black text-white/70"
                    >
                      {variant.size}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stock info */}
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d7ff53]/10 text-[#d7ff53]">
                <Eye size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">
                  Stok Tersisa
                </p>
                <p
                  className={`text-sm font-black ${
                    totalStock > 0 ? "text-[#d7ff53]" : "text-red-400"
                  }`}
                >
                  {isComingSoon
                    ? "Coming Soon"
                    : totalStock > 0
                    ? `${totalStock} pcs`
                    : "Habis"}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row">
              <Link
                href={isComingSoon ? "/products" : `/products/${product.slug}`}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-black uppercase tracking-wider transition ${
                  isComingSoon
                    ? "border border-white/10 bg-white/5 text-white/50"
                    : isSoldOut
                    ? "border border-red-400/30 bg-red-500/10 text-red-300"
                    : "bg-[#d7ff53] text-black hover:scale-[1.02] hover:bg-white"
                }`}
              >
                {isComingSoon ? (
                  "Coming Soon"
                ) : isSoldOut ? (
                  "Stok Habis"
                ) : (
                  <>
                    <ShoppingBag size={16} strokeWidth={2.5} />
                    Lihat Detail
                  </>
                )}
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 px-6 py-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white hover:text-black"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
