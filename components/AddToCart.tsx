"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ShoppingBag, Check, Minus, Plus, Sparkles } from "lucide-react";
import { rupiah } from "@/lib/format";
import type { AddToCartInput } from "@/components/CartProvider";

type Variant = {
  id: string;
  /** option_1_value or option_2_value */
  option1: string | null;
  option2: string | null;
  /** legacy color field, used as fallback when option1 is just "Default" */
  legacyColor?: string | null;
  stock: number;
  /** per-variant price (overrides product-level price) */
  price?: number | null;
};

type AddToCartFormProps = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
  /** label for the first option column — comes from option_1_name */
  option1Label?: string;
  /** label for the second option column — comes from option_2_name */
  option2Label?: string;
  variants: Variant[];
  addItem: (item: AddToCartInput) => Promise<boolean>;
};

export default function AddToCartForm({
  productId,
  name,
  slug,
  price,
  image,
  option1Label,
  option2Label,
  variants,
  addItem,
}: AddToCartFormProps) {
  const label1 = option1Label || "Opsi 1";
  const label2 = option2Label || "Opsi 2";

  // Check if any variant has a non-null, non-empty option2 value (true size/dimension exists)
  const hasRealOption2 = variants.some((v) => v.option2 && v.option2 !== "");

  // Check if any variant has a non-null, non-empty option1 value
  const hasRealOption1 = variants.some((v) => v.option1 && v.option1 !== "" && v.option1 !== "Default");

  // Determine if we need two-dimensional selection (has meaningful option1 AND option2)
  const usesTwoDimensionalSelection = hasRealOption2 && hasRealOption1;

  // Single-dimension with option1 only (no option2) — show option1 as the main selector
  const isSingleDimOption1 = !hasRealOption2 && hasRealOption1;

  // Effective option1 value for a variant (use option1 if meaningful, fallback to legacyColor or empty)
  const effectiveOpt1 = (v: Variant) => {
    if (v.option1 && v.option1 !== "" && v.option1 !== "Default") return v.option1;
    return v.legacyColor || "";
  };

  // Unique option1 values sorted logically for single-dim products
  const opt1Options = useMemo(() => {
    if (!isSingleDimOption1 && !usesTwoDimensionalSelection) return [] as string[];
    const unique = Array.from(new Set(variants.map((v) => effectiveOpt1(v)).filter((v) => v && v !== "")));
    // Sort sizes logically: XS < S < M < L < XL < XXL < XXXL < XXXXL < XXXXXL
    const order: Record<string, number> = {
      XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6, XXXL: 7, XXXXL: 8, XXXXXL: 9,
    };
    unique.sort((a, b) => {
      const oa = order[a] ?? 0, ob = order[b] ?? 0;
      if (oa && ob) return oa - ob;
      return a.localeCompare(b);
    });
    return unique;
  }, [variants, isSingleDimOption1, usesTwoDimensionalSelection, effectiveOpt1]);

  // Initial state
  const [selectedOpt1, setSelectedOpt1] = useState(
    isSingleDimOption1 || usesTwoDimensionalSelection
      ? (opt1Options[0] || variants[0]?.option1 || variants[0]?.legacyColor || "")
      : (variants[0]?.legacyColor || variants[0]?.option1 || "")
  );
  const [selectedOpt2, setSelectedOpt2] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- Derived data ---
  // Filter variants based on selected option1 (applies to single-dim option1 and two-dim modes)
  const filteredVariants = useMemo(() => {
    if (!isSingleDimOption1 && !usesTwoDimensionalSelection) return variants;
    if (!selectedOpt1) return variants;
    return variants.filter((v) => effectiveOpt1(v) === selectedOpt1);
  }, [variants, isSingleDimOption1, usesTwoDimensionalSelection, selectedOpt1, effectiveOpt1]);

  // Get available option2 (size) values from filtered variants
  const opt2Options = useMemo(() => {
    if (!hasRealOption2) return [] as string[];
    const vals = Array.from(new Set(filteredVariants.map((v) => v.option2))).filter(Boolean) as string[];
    const order: Record<string, number> = {
      XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6, XXXL: 7, XXXXL: 8, XXXXXL: 9,
    };
    vals.sort((a, b) => (order[a] ?? a.length * 100) - (order[b] ?? b.length * 100));
    return vals;
  }, [filteredVariants, hasRealOption2]);

  // Select the variant based on current selections
  const selectedVariant = useMemo(() => {
    if (isSingleDimOption1) {
      // No option2 — find variant matching selected option1
      if (!selectedOpt1) return variants[0] || null;
      return variants.find((v) => effectiveOpt1(v) === selectedOpt1) || variants[0] || null;
    }
    if (!hasRealOption2) {
      // No size dimension and no meaningful option1 — use the first variant directly
      return variants[0] || null;
    }
    if (!usesTwoDimensionalSelection) {
      // Has option2 but no meaningful option1 — treat as single-dimension with only size selector
      return filteredVariants.find((v) => v.option2 === selectedOpt2) || variants[0] || null;
    }
    // Two-dimensional product: need both option1 and option2 selected
    if (!selectedOpt2) return null;
    return filteredVariants.find((v) => v.option2 === selectedOpt2);
  }, [filteredVariants, selectedOpt2, selectedOpt1, hasRealOption2, isSingleDimOption1, usesTwoDimensionalSelection, variants, effectiveOpt1]);

  // Calculate stock availability
  const maxStock = (isSingleDimOption1 || usesTwoDimensionalSelection)
    ? Number(selectedVariant?.stock ?? 0)
    : Number(variants[0]?.stock ?? 0);

  // For two-dimensional products, only show "Sold Out" after the user has
  // selected both option1 and option2. Before selection, show neutral state.
  const hasSelectedVariant = !usesTwoDimensionalSelection || (usesTwoDimensionalSelection && !!selectedOpt1 && !!selectedOpt2);
  const isSoldOut = hasSelectedVariant && maxStock <= 0;
  const allSoldOut = filteredVariants.length > 0 && filteredVariants.every((v) => Number(v.stock ?? 0) <= 0);
  const showQuantity = isSingleDimOption1 ? !!selectedOpt1 : hasRealOption2 ? !!selectedOpt2 : true;

  // --- Handlers ---
  function chooseOpt1(val: string) {
    setSelectedOpt1(val);
    setSelectedOpt2("");
    setQuantity(1);
    setAdded(false);
  }

  function chooseOpt2(val: string) {
    setSelectedOpt2(val);
    setQuantity(1);
    setAdded(false);
  }

  // --- Submit ---
  async function addToCart() {
    if (submitting) return;

    // Validate we have a valid selected variant
    if (!selectedVariant) return;
    if (isSoldOut) return;

    setSubmitting(true);
    try {
      // For single-dimension products (no size), send empty string for size field
      const sizeToSend = !hasRealOption2 ? "" : (selectedVariant.option2 || "");

      const effectiveVariantPrice = Number(selectedVariant.price ?? price);
      const success = await addItem({
        product_id: productId,
        variant_id: selectedVariant.id,
        name,
        slug,
        size: sizeToSend,
        image_url: image,
        price: effectiveVariantPrice,
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

  // --- Sold Out state (all variants sold out) ---
  if (allSoldOut) {
    return (
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 sm:backdrop-blur-md">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(255,90,90,0.08),_transparent_60%)]" />
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-lg font-black uppercase tracking-tight text-white">
              Stok Habis
            </p>
            <p className="text-xs text-white/45">
              Semua ukuran stok habis. Pantau restock berikutnya.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Render ---
  return (
    <div className="space-y-5">
      {/* Option 1 selector — shown for two-dimensional or single-dimension option1 products */}
      {(isSingleDimOption1 || (usesTwoDimensionalSelection && opt1Options.length > 1)) && opt1Options.length > 1 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
              {isSingleDimOption1 ? label2 : label1}
            </p>
            {isSingleDimOption1 && (
              <Link
                href="#size-guide"
                className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 transition hover:text-[#d7ff53]"
              >
                Panduan Ukuran →
              </Link>
            )}
            {!isSingleDimOption1 && (
              <p className="text-xs font-bold text-white/70">{selectedOpt1}</p>
            )}
          </div>
          <div className={isSingleDimOption1 ? "grid grid-cols-4 gap-1.5 sm:gap-2 sm:grid-cols-5" : "flex flex-wrap gap-1.5 sm:gap-2"}>
            {opt1Options.map((val) => {
              const isActive = val === selectedOpt1;
              const variantMatch = isSingleDimOption1
                ? variants.find((v) => effectiveOpt1(v) === val)
                : filteredVariants.find((v) => effectiveOpt1(v) === val);
              const stock = variantMatch ? Number(variantMatch.stock || 0) : 0;
              const isOut = isSingleDimOption1 && stock <= 0;
              return (
                <button
                  key={val}
                  type="button"
                  disabled={isOut}
                  onClick={() => chooseOpt1(val)}
                  className={`relative overflow-hidden rounded-lg sm:rounded-xl border px-2.5 py-2 sm:px-3 sm:py-3 text-xs sm:text-sm font-black transition-all duration-300 ${
                    isActive
                      ? "border-[#d7ff53] bg-[#d7ff53] text-black"
                      : isOut
                        ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-white/25 line-through"
                        : "border-white/10 bg-white/5 text-white hover:border-white/30"
                  } ${!isSingleDimOption1 ? "px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-wider" : ""}`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Single option1 value display (when only 1 option1 exists in two-dim mode) */}
      {usesTwoDimensionalSelection && opt1Options.length === 1 && (
        <div className="text-xs text-white/50">{label1}: {opt1Options[0]}</div>
      )}

      {/* Option 2 (size) selector — only shown when product has real size options */}
      {hasRealOption2 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
              {label2}
            </p>
            <Link
              href="#size-guide"
              className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 transition hover:text-[#d7ff53]"
            >
              Panduan Ukuran →
            </Link>
          </div>
          {opt2Options.length > 0 ? (
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 sm:grid-cols-5">
              {opt2Options.map((val) => {
                const variant = filteredVariants.find((v) => v.option2 === val);
                const stock = variant ? Number(variant.stock || 0) : 0;
                const isOut = stock <= 0;
                const isActive = selectedOpt2 === val;
                return (
                  <button
                    key={val}
                    type="button"
                    disabled={isOut}
                    onClick={() => chooseOpt2(val)}
                    className={`relative overflow-hidden rounded-lg sm:rounded-xl border px-2.5 py-2 sm:px-3 sm:py-3 text-xs sm:text-sm font-black transition-all duration-300 ${
                      isActive
                        ? "border-[#d7ff53] bg-[#d7ff53] text-black"
                        : isOut
                          ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-white/25 line-through"
                          : "border-white/10 bg-white/5 text-white hover:border-white/30"
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="py-3 text-center text-sm text-white/40">
              Tidak ada pilihan yang tersedia.
            </p>
          )}
        </div>
      )}

      {/* Quantity selector — shown when a variant can be selected */}
      {showQuantity && (
        <div className="flex items-center justify-between" style={{ animation: "fade-in 400ms ease-out" }}>
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/50">
            Jumlah
          </p>
          <div className="flex items-center gap-2 sm:gap-3 rounded-full border border-white/10 bg-white/[0.03] p-0.5 sm:p-1 sm:backdrop-blur-md">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
              aria-label="Kurangi jumlah"
            >
              <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <span className="min-w-[1.2rem] sm:min-w-[1.5rem] text-center font-display text-sm sm:text-base font-black tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
              disabled={quantity >= maxStock}
              className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
              aria-label="Tambah jumlah"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Price & CTA button */}
      <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 sm:backdrop-blur-md">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/50">
            Subtotal
          </p>
          <p className="font-display text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-white">
            {rupiah(Number(selectedVariant?.price ?? price) * quantity)}
          </p>
        </div>
        {selectedVariant && (
          <p className="mt-1.5 sm:mt-2 text-right text-[9px] sm:text-[10px] uppercase tracking-widest text-white/35">
            Stok: {maxStock} tersedia
          </p>
        )}

        <button
          type="button"
          onClick={addToCart}
          disabled={!selectedVariant || isSoldOut || submitting}
          className={`group relative mt-3 sm:mt-5 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full px-4 sm:px-6 py-3 sm:py-4 text-[11px] sm:text-sm font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all duration-500 ${
            added
              ? "bg-white text-black"
              : (!selectedVariant || isSoldOut || submitting)
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
                <Check className="h-4 w-4" /> Masuk Keranjang
              </>
            ) : isSoldOut ? (
              <>Stok Habis</>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" /> Tambah ke Keranjang
              </>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}