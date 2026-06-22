"use client";

import { useMemo, useState } from "react";

const sizes = ["S", "M", "L", "XL", "XXL"];

type Variant = {
  color: string;
  size: string;
  stock: number;
};

export default function AdminVariantInputs() {
  const [colorsText, setColorsText] = useState("Black, Cream, Green");
  const [stocks, setStocks] = useState<Record<string, number>>({});

  const colors = useMemo(() => {
    return colorsText
      .split(",")
      .map((color) => color.trim())
      .filter(Boolean);
  }, [colorsText]);

  const variants: Variant[] = colors.flatMap((color) =>
    sizes.map((size) => ({
      color,
      size,
      stock: Number(stocks[`${color}_${size}`] || 0),
    }))
  );

  function updateStock(color: string, size: string, value: string) {
    setStocks((prev) => ({
      ...prev,
      [`${color}_${size}`]: Number(value || 0),
    }));
  }

  return (
    <div className="lg:col-span-2">
      <label className="mb-2 block text-xs font-black uppercase tracking-widest text-white/40">
        Warna Produk
      </label>

      <input
        name="colors_display"
        value={colorsText}
        onChange={(e) => setColorsText(e.target.value)}
        placeholder="Black, Cream, Army Green"
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#d7ff53]"
      />

      <p className="mt-2 text-xs font-bold text-white/40">
        Pisahkan warna pakai koma. Contoh: Black, Cream, Army Green
      </p>

      <input
        type="hidden"
        name="variants_json"
        value={JSON.stringify(variants)}
      />

      <div className="mt-6">
        <p className="mb-3 text-xs font-black uppercase tracking-widest text-white/40">
          Stock Per Warna & Size
        </p>

        {colors.length === 0 ? (
          <div className="rounded-[1.5rem] border border-red-400/20 bg-red-500/10 p-5 text-sm font-bold text-red-300">
            Isi minimal 1 warna produk.
          </div>
        ) : (
          <div className="space-y-5">
            {colors.map((color) => (
              <div
                key={color}
                className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4"
              >
                <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-[#d7ff53]">
                  {color}
                </h3>

                <div className="grid gap-3 sm:grid-cols-5">
                  {sizes.map((size) => (
                    <div key={`${color}-${size}`}>
                      <label className="mb-2 block text-xs font-black uppercase tracking-widest text-white/35">
                        {size}
                      </label>

                      <input
                        type="number"
                        min={0}
                        value={stocks[`${color}_${size}`] || 0}
                        onChange={(e) =>
                          updateStock(color, size, e.target.value)
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm font-black text-white outline-none focus:border-[#d7ff53]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}