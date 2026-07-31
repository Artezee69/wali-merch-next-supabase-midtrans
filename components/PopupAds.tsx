"use client";

import { useEffect, useState } from "react";

interface PopupAd {
  id: number;
  image_url: string;
  link: string;
  status: boolean;
  sort_order: number;
}

export default function PopupAds() {
  const [ads, setAds] = useState<PopupAd[]>([]);
  const [dismissed, setDismissed] = useState<Record<number, boolean>>({});
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load dismissed from localStorage
    const stored = localStorage.getItem("popup_dismissed");
    if (stored) setDismissed(JSON.parse(stored));

    // Fetch from API
    fetch("/api/popup-ads")
      .then((r) => r.json())
      .then(({ data }) => {
        setAds(data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Find first non-dismissed ad
  useEffect(() => {
    if (loading || ads.length === 0) return;
    const active = ads.find((ad) => !dismissed[ad.id]);
    if (active) setVisible(true);
  }, [ads, dismissed, loading]);

  const dismiss = (id: number) => {
    setDismissed((prev) => ({ ...prev, [id]: true }));
    localStorage.setItem("popup_dismissed", JSON.stringify({ ...dismissed, [id]: true }));
    setVisible(false);
  };

  if (loading || !visible || ads.length === 0) return null;

  const ad = ads.find((a) => !dismissed[a.id])!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => dismiss(ad.id)} />
      <div className="relative bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <a href={ad.link} target="_blank" rel="noopener noreferrer" onClick={() => dismiss(ad.id)}>
          <img src={ad.image_url} alt="promo" className="w-full h-auto max-h-[70vh] object-contain" />
        </a>
        <button
          onClick={(e) => { e.stopPropagation(); dismiss(ad.id); }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-gray-700 font-bold shadow-lg"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
