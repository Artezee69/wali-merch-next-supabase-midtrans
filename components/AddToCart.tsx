"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ShoppingBag, Check, Minus, Plus, Sparkles } from "lucide-react";
import { rupiah } from "@/lib/format";
import { useCartContext } from "@/components/CartProvider";

type Variant = {
  id: string;
  /** option_1_value or option_2_value — whichever maps to the grouping dimension */
  option1: string | null;
  option2: string | null;
  /** legacy color field, used as fallback when option1 is just "Default" */
  legacyColor?: string | null;
  stock: number;
};

type AddToCartBoxProps = {
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
};

export default function AddToCartBox({
  productId,
  name,
  slug,
  price,
  image,
  option1Label,
  option2Label,
  variants,
}: AddToCartBoxProps) {
  const { addItem } = useCartContext();

  const label1 = option1Label || "Option 1";
  const label2 = option2Label || "Option 2";

  // --- Smart auto-detect: does this product use 2-group or 1-group variants? ---
  // If every variant has option1 === "Default", treat it as 1-group (show only option2).
  // Otherwise treat it as 2-group (show option1 as first selector).
  const allDefaultOpt1 = variants.every((v) => v.option1 === "Default" || v.option1 === "");
  const isOneGroup = allDefaultOpt1;

  // Effective option1 value for a variant (use legacyColor if option1 is useless)
  const effectiveOpt1 = (v: Variant) => {
    if (v.option1 && v.option1 !== "Default") return v.option1;
    return v.legacyColor || "Default";
  };

  const [selectedOpt1, setSelectedOpt1] = useState(
    isOneGroup ? (variants[0]?.legacyColor || "Default") : (variants[0]?.option1 || "")
  );
  const [selectedOpt2, setSelectedOpt2] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- Derived data ---
  const opt1Options = useMemo(() => {
    if (isOneGroup) return [];
    const unique = Array.from(
      new Set(variants.map((v) => effectiveOpt1(v)).filter(Boolean))
    );
    return unique as string[];
  }, [variants, isOneGroup, effectiveOpt1]);

  const filteredVariants = useMemo(() => {
    if (isOneGroup) return variants;
    return variants.filter((v) => effectiveOpt1(v) === selectedOpt1);
  }, [variants, isOneGroup, selectedOpt1, effectiveOpt1]);

  const opt2Options = useMemo(() => {
    const vals = Array.from(new Set(filteredVariants.map((v) => v.option2))).filter(Boolean) as string[];
    // Sort sizes logically: M < L < XL < XXL < XXXL
    const order: Record<string, number> = {
      XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6, XXXL: 7, XXXXL: 8, XXXXXL: 9,
    };
    vals.sort((a, b) => (order[a] ?? a.length * 100) - (order[b] ?? b.length * 100));
    return vals;
  }, [filteredVariants]);

  const selectedVariant = useMemo(() => {
    if (!selectedOpt2) return null;
    return filteredVariants.find((v) => v.option2 === selectedOpt2);
  }, [filteredVariants, selectedOpt2]);

  const maxStock = Number(selectedVariant?.stock || 0);
  const isSoldOut = maxStock <= 0;
  const allSoldOut = filteredVariants.length > 0 && filteredVariants.every((v) => Number(v.stock || 0) <= 0);

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
    if (!selectedVariant || isSoldOut) return;
    if (submitting) return;

    setSubmitting(true);
    try {
      const success = await addItem({
        product_id: productId,
        variant_id: selectedVariant.id,
        name,
        slug,
        size: selectedVariant.option2!,
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

  // --- Sold Out state ---
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

  // --- Render ---
  return (
    <div className="space-y-5">
      {/* Option 1 — only shown when it has meaningful (non-Default) values */}
      {!isOneGroup && opt1Options.length > 1 ? (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
              {label1}
            </p>
            <p className="text-xs font-bold text-white/70">{selectedOpt1}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {opt1Options.map((val) => {
              const isActive = val === selectedOpt1;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => chooseOpt1(val)}
                  className={`relative rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    isActive
                      ? "border-[#d7ff53] bg-[#d7ff53] text-black"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ) : !isOneGroup && opt1Options.length === 1 ? (
        /* Only 1 option1 value — hide the selector, just show value */
        <div className="text-xs text-white/50">{label1}: {opt1Options[0]}</div>
      ) : null}

      {/* Option 2 — always shown */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
            {label2}
          </p>
          <Link
            href="#size-guide"
            className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 transition hover:text-[#d7ff53]"
          >
            Size Guide →
          </Link>
        </div>
        {opt2Options.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
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
                  className={`relative overflow-hidden rounded-xl border px-3 py-3 text-sm font-black transition-all duration-300 ${
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

      {/* Quantity */}
      {selectedOpt2 && (
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
          disabled={!selectedOpt2 || isSoldOut || submitting}
          className={`group relative mt-5 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-4 text-sm font-black uppercase tracking-[0.2em] transition-all duration-500 ${
            added
              ? "bg-white text-black"
              : !selectedOpt2 || isSoldOut || submitting
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
