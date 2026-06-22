"use client";

import { useState } from "react";
import Image from "next/image";
import { Maximize2, ImageOff } from "lucide-react";

type ProductImage = {
  id: string;
  image_url: string;
  alt?: string;
};

type ProductImageGalleryProps = {
  images: ProductImage[];
  productName: string;
  tag?: string;
};

export default function ProductImageGallery({
  images,
  productName,
  tag,
}: ProductImageGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const hasImages = images.length > 0;
  const active = hasImages ? images[activeIdx] : null;
  const mainSrc = active?.image_url || "";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="space-y-4">
      {/* Main image with zoom */}
      <div
        className="group relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-sm"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-[#d7ff53]/10 via-transparent to-[#5e8bff]/10 opacity-50" />

        {hasImages ? (
          <Image
            src={mainSrc}
            alt={active?.alt || productName}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out"
            style={{
              transform: zoom ? "scale(1.8)" : "scale(1)",
              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff className="h-16 w-16 text-white/20" />
          </div>
        )}

        {/* Hover zoom hint */}
        <div
          className={`pointer-events-none absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md transition-all duration-300 ${
            zoom ? "opacity-0" : "opacity-100"
          }`}
        >
          <Maximize2 className="h-3 w-3" />
          Hover to zoom
        </div>

        {/* Tag badge */}
        {tag && (
          <div className="absolute left-4 top-4 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7ff53]/30 bg-[#0b0b0b]/60 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#d7ff53] backdrop-blur-md">
              <span className="h-1 w-1 rounded-full bg-[#d7ff53] animate-pulse-soft" />
              {tag}
            </span>
          </div>
        )}

        {/* Bottom: image counter */}
        {hasImages && (
          <div className="absolute bottom-4 right-4 z-10">
            <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white/70 backdrop-blur-md">
              {String(activeIdx + 1).padStart(2, "0")}{" "}
              <span className="text-white/30">/</span>{" "}
              {String(images.length).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>

      {/* Thumbnail rail */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                i === activeIdx
                  ? "border-[#d7ff53] shadow-[0_0_20px_-4px_rgba(215,255,83,0.5)]"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <Image
                src={img.image_url}
                alt={img.alt || `${productName} ${i + 1}`}
                fill
                sizes="120px"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {i === activeIdx && (
                <div className="absolute inset-0 bg-[#d7ff53]/10" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}