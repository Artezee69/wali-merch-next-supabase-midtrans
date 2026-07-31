"use client";

import { useEffect, useState } from "react";
import { usePopupAds } from "@/hooks/usePopupAds";

type PopupAd = {
  id: number;
  title: string;
  subtitle?: string;
  body: string;
  image_url: string;
  button_text?: string;
  button_link?: string;
  position: "center" | "bottom_right";
  audience: "all" | "logged_in" | "guest";
  dismiss_minutes: number;
};

// Main component that renders popup ads
export function PopupAds() {
  const { popupAds, isLoading, dismissPopup } = usePopupAds();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (popupAds) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [popupAds]);

  if (isLoading || !popupAds) return null;

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    dismissPopup(popupAds.id);
  };

  if (popupAds.position === "center") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div
          className="relative rounded-2xl overflow-hidden bg-white text-black shadow-2xl max-w-md w-full transform scale-100 animate-in fade-in duration-300"
          onClick={handleClose}
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 rounded-full bg-white/80 hover:bg-white text-gray-700 w-8 h-8 flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none"
            aria-label="Tutup iklan"
          >
            <span className="text-lg">×</span>
          </button>

          {popupAds.image_url ? (
            <img src={popupAds.image_url} alt={popupAds.title} className="w-full h-48 object-cover" />
          ) : (
            <div className="h-48 bg-gradient-to-br from-green-50 to-blue-50" />
          )}

          <div className="p-6 space-y-3">
            <h3 className="text-xl font-bold">{popupAds.title}</h3>
            {popupAds.subtitle && (
              <p className="text-sm text-gray-600">{popupAds.subtitle}</p>
            )}
            <p className="text-base leading-relaxed">{popupAds.body}</p>

            {popupAds.button_link && (
              <a
                href={popupAds.button_link}
                onClick={(e) => {
                  e.preventDefault();
                  if (popupAds) dismissPopup(popupAds.id);
                }}
                className="w-full mt-4 block py-2 px-4 bg-[#d7ff53] text-black font-bold text-sm rounded hover:bg-opacity-90 transition-colors"
              >
                {popupAds.button_text || "Kunjungi"}
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Bottom right position
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className="relative rounded-lg overflow-hidden bg-white shadow-lg max-w-sm w-full p-4 animate-in slide-in-from-right duration-300"
        onClick={handleClose}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-2 right-2 z-10 rounded-full w-6 h-6 flex items-center justify-center text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
          aria-label="Tutup"
        >
          ✕
        </button>

        {popupAds.image_url ? (
          <img
            src={popupAds.image_url}
            alt={popupAds.title}
            className="rounded-lg w-full h-32 object-cover mb-3"
          />
        ) : (
          <div className="h-32 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg mb-3" />
        )}

        <div className="space-y-2">
          <h4 className="font-bold text-sm">{popupAds.title}</h4>
          <p className="text-xs text-gray-600 line-clamp-2">{popupAds.body}</p>

          {popupAds.button_link && (
            <a
              href={popupAds.button_link}
              onClick={(e) => {
                e.preventDefault();
                if (popupAds) dismissPopup(popupAds.id);
              }}
              className="mt-2 inline-block px-3 py-1 bg-[#d7ff53] text-black text-xs font-bold rounded hover:bg-opacity-90 transition-colors"
            >
              {popupAds.button_text || "Kunjungi"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Default export for ClientLayout usage
export default PopupAds;