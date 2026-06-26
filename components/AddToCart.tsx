"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ShoppingBag, Check, Minus, Plus, Sparkles } from "lucide-react";
import { rupiah } from "@/lib/format";
import { useCartContext } from "@/components/CartProvider";

type Variant = {
  id: string;
  size: string | null;
  color?: string | null;
  stock: number;
};

type AddToCartBoxProps = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
  variants: Variant[];
};

export default function AddToCartBox({
  productId,
  name,
  slug,
  price,
  image,
  variants,
}: AddToCartBoxProps) {
  const { addItem } = useCartContext();

  // Auto-detect variant mode: if any variant has both color+size, use 2-group.
  // Otherwise use 1-group (only size) or 2-group with a single color.
  const hasColor = variants.some((v) => v.color && v.color !== "Default");
  const variantMode = hasColor ? ("two-group" as const) : ("one-group" as const);

  const colorOptions = useMemo(() => {
    if (variantMode === "one-group") return null;
    const unique = Array.from(
      new Set(
        variants.map((v) => (v.color ? v.color.trim() : "Default")).filter(Boolean)
      )
    ).filter(Boolean);
    return unique.length > 0 ? unique : ["Default"];
  }, [variants, variantMode]);

  const [selectedColor, setSelectedColor] = useState(colorOptions?.[0] || "Default");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filteredVariants = useMemo(() => {
    return variantMode === "two-group"
      ? variants.filter((v) => (v.color || "Default") === selectedColor)
      : variants;
  }, [variants, variantMode, selectedColor]);

  const sizes = useMemo(() => {
    if (variantMode === "one-group") {
      // Sort by logical size order: M, L, XL, XXL, etc.
      const sizes = Array.from(new Set(filteredVariants.map((v) => v.size))).filter(Boolean) as string[];
      const order: Record<string, number> = { XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6, XXXL: 7, XXXXL: 8, XXXXXL: 9 };
      sizes.sort((a, b) => (order[a] || a.length * 10) - (order[b] || b.length * 10));
      return sizes;
    }
    // two-group: extract sizes from filtered variants
    return Array.from(new Set(filteredVariants.map((v) => v.size))).filter(Boolean) as string[];
  }, [filteredVariants, variantMode]);

  const selectedVariant = useMemo(() => {
    return filteredVariants.find(
      (v) => v.size === selectedSize
    );
  }, [filteredVariants, selectedSize]);

  const maxStock = Number(selectedVariant?.stock || 0);
  const isSoldOut = maxStock <= 0;
  const allSoldOut = filteredVariants.every((v) => Number(v.stock || 0) <= 0) && filteredVariants.length > 0;

  function chooseColor(color: string) {
    setSelectedColor(color);
    setSelectedSize("");
    setQuantity(1);
    setAdded(false);
  }

  function chooseSize(size: string) {
    setSelectedSize(size);
    setQuantity(1);
    setAdded(false);
  }

  async function addToCart() {
    if (!selectedVariant || isSoldOut) return;
    if (submitting) return;

    setSubmitting(true);
    try {
      const success = await addItem({
        product_id: productId,
        variant_id: selectedVariant.id,
        name,
        slug,
        size: selectedVariant.size!,
        image_url: image,
        price,
        quantity,
      });

      if (success) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2200);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (allSoldOut) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(255,90,90,0.08),_transparent_60%)]" />
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-lg font-black uppercase tracking-tight text-white">
              Sold Out
            </p>
            <p className="text-xs text-white/45">
              Semua ukuran stok habis. Pantau restock berikutnya.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Color selector — only show for 2-group variants */}
      {colorOptions && colorOptions.length > 1 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
              Color
            </p>
            <p className="text-xs font-bold text-white/70">{selectedColor}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((color) => {
              const isActive = color === selectedColor;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => chooseColor(color)}
                  className={`relative rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    isActive
                      ? "border-[#d7ff53] bg-[#d7ff53] text-black"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size selector — always show */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
            Size
          </p>
          <Link
            href="#size-guide"
            className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 transition hover:text-[#d7ff53]"
          >
            Size Guide →
          </Link>
        </div>
        {sizes.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {sizes.map((size) => {
              const variant = filteredVariants.find((v) => v.size === size);
              const stock = variant ? Number(variant.stock || 0) : 0;
              const isOut = stock <= 0;
              const isActive = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  disabled={isOut}
                  onClick={() => chooseSize(size)}
                  className={`relative overflow-hidden rounded-xl border px-3 py-3 text-sm font-black transition-all duration-300 ${
                    isActive
                      ? "border-[#d7ff53] bg-[#d7ff53] text-black"
                      : isOut
                      ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-white/25 line-through"
                      : "border-white/10 bg-white/5 text-white hover:border-white/30"
                  }`}
                >
                  {size || "—"}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="py-3 text-center text-sm text-white/40">
            Tidak ada ukuran yang tersedia.
          </p>
        )}
      </div>

      {/* Quantity */}
      {selectedSize && (
        <div
          className="flex items-center justify-between"
          style={{ animation: "fade-in 400ms ease-out" }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
            Quantity
          </p>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] p-1 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[1.5rem] text-center font-display text-base font-black tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
              disabled={quantity >= maxStock}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Price & CTA */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
            Subtotal
          </p>
          <p className="font-display text-2xl font-black tracking-tight text-white md:text-3xl">
            {rupiah(price * quantity)}
          </p>
        </div>
        {selectedVariant && (
          <p className="mt-2 text-right text-[10px] uppercase tracking-widest text-white/35">
            Stok: {maxStock} tersedia
          </p>
        )}

        <button
          type="button"
          onClick={addToCart}
          disabled={!selectedSize || isSoldOut || submitting}
          className={`group relative mt-5 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-4 text-sm font-black uppercase tracking-[0.2em] transition-all duration-500 ${
            added
              ? "bg-white text-black"
              : !selectedSize || isSoldOut || submitting
              ? "cursor-not-allowed bg-white/5 text-white/30"
              : "bg-[#d7ff53] text-black hover:shadow-[0_0_50px_-8px_rgba(215,255,83,0.5)]"
          }`}
        >
          {!added && (
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          )}
          <span className="relative flex items-center gap-2">
            {added ? (
              <>
                <Check className="h-4 w-4" /> Added to Cart
              </>
            ) : isSoldOut ? (
              <>Sold Out</>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" /> Add to Cart
              </>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
