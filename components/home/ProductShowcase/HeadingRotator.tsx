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
    <div className="mb-2 flex items-end justify-between gap-4">
      <div className="overflow-hidden">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#d7ff53]/50">
          Season 01 · Collection 26
        </p>
        <h2 className="text-3xl font-black uppercase tracking-tighter text-white transition-all duration-600 md:text-6xl lg:text-7xl">
          <span
            key={headingIdx}
            className="inline-block"
            style={{
              animation: "heading-pop 700ms cubic-bezier(0.16, 1, 0.3, 1) both",
            }}
          >
            {headings[headingIdx]}
          </span>
        </h2>
      </div>
    </div>
  );
}