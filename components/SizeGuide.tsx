"use client";

import { useEffect, useState } from "react";
import { X, Ruler } from "lucide-react";

type SizeGuideProps = {
  isOpen: boolean;
  onClose: () => void;
};

const sizeData = [
  { size: "S", chest: "92 cm", length: "68 cm", shoulder: "44 cm" },
  { size: "M", chest: "100 cm", length: "70 cm", shoulder: "46 cm" },
  { size: "L", chest: "108 cm", length: "72 cm", shoulder: "48 cm" },
  { size: "XL", chest: "116 cm", length: "74 cm", shoulder: "50 cm" },
  { size: "XXL", chest: "124 cm", length: "76 cm", shoulder: "52 cm" },
];

export default function SizeGuide({ isOpen, onClose }: SizeGuideProps) {
  // Prevent scroll when open
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-t-3xl border-t border-white/10 bg-[#0b0b0b] sm:rounded-3xl sm:border sm:shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0b0b0b] p-4 sm:p-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d7ff53]/20 bg-[#d7ff53]/10 text-[#d7ff53]">
              <Ruler size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-black uppercase text-white sm:text-lg">
                Size Guide
              </h2>
              <p className="text-[10px] text-white/50 sm:text-xs">
                Ukuran dalam sentimeter
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-[#d7ff53] hover:text-[#d7ff53]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Table */}
        <div className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-white/50 sm:text-xs">
                  <th className="pb-3 pr-2">Size</th>
                  <th className="pb-3 pr-2">Lebar</th>
                  <th className="pb-3 pr-2">Panjang</th>
                  <th className="pb-3">Bahu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sizeData.map((row) => (
                  <tr
                    key={row.size}
                    className="text-white transition hover:bg-white/[0.04]"
                  >
                    <td className="py-3 pr-2 font-black text-[#d7ff53]">
                      {row.size}
                    </td>
                    <td className="py-3 pr-2 font-bold">{row.chest}</td>
                    <td className="py-3 pr-2 font-bold">{row.length}</td>
                    <td className="py-3 font-bold">{row.shoulder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-2xl border border-[#d7ff53]/20 bg-[#d7ff53]/5 p-3 sm:mt-5 sm:p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#d7ff53] sm:text-xs">
              💡 Tips
            </p>
            <p className="mt-1.5 text-xs leading-6 text-white/70 sm:text-sm">
              Untuk kaos reguler, pilih ukuran sesuai dengan lebar dada
              kamu. Jika ragu antara 2 ukuran, pilih ukuran yang lebih besar
              untuk fit yang lebih nyaman.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}