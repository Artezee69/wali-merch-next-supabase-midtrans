"use client";

import { useEffect, useState } from "react";

const headings = ["Fresh Kills", "New Drops", "Next Batch", "New Arrivals"];

export default function HeadingRotator() {
  const [headingIdx, setHeadingIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setHeadingIdx((p) => (p + 1) % headings.length),
      4000
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between md:gap-6">
      <div className="overflow-hidden">
        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.35em] text-[#d7ff53]">
          Season 01 · Collection 26
        </p>
        <h2 className="text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          <span
            key={headingIdx}
            className="inline-block"
            style={{
              animation: "heading-pop 600ms cubic-bezier(0.16, 1, 0.3, 1) both",
            }}
          >
            {headings[headingIdx]}
          </span>
        </h2>
      </div>
      {/* Accent rule */}
      <div className="mt-4 h-px w-full max-w-[120px] bg-gradient-to-r from-[#d7ff53] to-transparent md:mb-2 md:mt-0 md:w-[200px]" />
    </div>
  );
}
