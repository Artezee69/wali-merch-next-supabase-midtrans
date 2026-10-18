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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Center modal — more elegant & mobile-optimized
  if (popupAds.position === "center") {
    const useFullScreen = isMobile;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 sm:backdrop-blur-md animate-fade-in">
        <div
          className={`relative overflow-hidden bg-black shadow-2xl transform scale-100 animate-in fade-in duration-300 ${
            useFullScreen
              ? "inset-0 w-full h-full max-w-none rounded-none"
              : "w-full max-w-md rounded-3xl mx-4"
          }`}
          style={{
            maxHeight: useFullScreen ? "100dvh" : undefined,
            overflowY: "auto",
          }}
          onClick={handleClose}
        >
          {/* Close button — no backdrop-blur on mobile */}
          <button
            type="button"
            onClick={handleClose}
            className={`absolute top-0 right-0 z-20 flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none ${
              useFullScreen
                ? "top-4 right-4 w-10 h-10 rounded-full bg-black/70 text-white border border-white/20 sm:bg-black/50 sm:backdrop-blur-md"
                : "top-4 right-4 w-8 h-8 rounded-full bg-white/90 text-gray-700 border border-white/30 sm:backdrop-blur-md"
            }`}
            aria-label="Tutup iklan"
          >
            <span className={`font-light ${useFullScreen ? "text-xl" : "text-lg"}`}>×</span>
          </button>

          {/* Image — full bleed on mobile, lazy loaded */}
          {popupAds.image_url ? (
            <div className={`${useFullScreen ? "h-[45dvh] sm:h-64 md:h-72" : "h-48 sm:h-56 md:h-64"} relative overflow-hidden`}>
              <img
                src={popupAds.image_url}
                alt={popupAds.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          ) : (
            <div className={`${useFullScreen ? "h-[45dvh] sm:h-64" : "h-48"} bg-gradient-to-br from-green-500/20 to-blue-500/20`} />
          )}

          {/* Content */}
          <div className={`${useFullScreen ? "px-6 py-6 sm:px-8 sm:py-8" : "p-6"} space-y-3 bg-black`}>
            {/* Badge — pulse animation disabled on mobile */}
            {popupAds.subtitle && (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d7ff53]/30 bg-[#d7ff53]/10 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d7ff53] sm:animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d7ff53]">
                  {popupAds.subtitle}
                </span>
              </div>
            )}

            {/* Title */}
            <h3 className={`font-black leading-tight tracking-tight text-white ${
              useFullScreen ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
            }`}>
              {popupAds.title}
            </h3>

            {/* Body */}
            <p className={`leading-relaxed text-white/70 ${
              useFullScreen ? "text-sm sm:text-base" : "text-sm"
            }`}>
              {popupAds.body}
            </p>

            {/* CTA Button */}
            {popupAds.button_link && (
              <a
                href={popupAds.button_link}
                onClick={(e) => {
                  e.preventDefault();
                  if (popupAds) dismissPopup(popupAds.id);
                }}
                className={`mt-5 block text-center font-black uppercase tracking-wider transition-all duration-300 hover:shadow-lg hover:shadow-[#d7ff53]/30 ${
                  useFullScreen
                    ? "rounded-full bg-[#d7ff53] px-8 py-4 text-sm text-black"
                    : "rounded-full bg-[#d7ff53] px-6 py-3 text-xs text-black"
                }`}
              >
                {popupAds.button_text || "Kunjungi"}
              </a>
            )}

            {/* Subtle footer hint */}
            <p className="text-center text-[10px] text-white/30">
              Klik di luar untuk menutup
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Bottom right position — more compact and polished on mobile
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 sm:bottom-4 sm:left-auto sm:right-4 sm:w-auto">
      <div
        className={`relative overflow-hidden bg-black shadow-xl ${
          isMobile
            ? "rounded-t-2xl mx-0 sm:rounded-2xl sm:mx-0"
            : "rounded-2xl"
        }`}
        onClick={handleClose}
      >
        {/* Mobile bottom sheet handle */}
        {isMobile && (
          <div className="flex justify-center py-3 sm:hidden">
            <div className="h-1 w-12 rounded-full bg-white/20" />
          </div>
        )}

        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 rounded-full w-7 h-7 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 focus:outline-none"
          aria-label="Tutup"
        >
          <span className="text-sm font-light">✕</span>
        </button>

        {/* Image — lazy loaded */}
        {popupAds.image_url ? (
          <img
            src={popupAds.image_url}
            alt={popupAds.title}
            loading="lazy"
            decoding="async"
            className="w-full h-32 sm:h-32 object-cover"
          />
        ) : (
          <div className="h-32 sm:h-32 bg-gradient-to-br from-green-500/20 to-blue-500/20" />
        )}

        {/* Content */}
        <div className="p-4 sm:p-4 space-y-2 bg-black">
          <h4 className="font-black text-sm text-white">{popupAds.title}</h4>
          <p className="text-xs text-white/60 line-clamp-2">{popupAds.body}</p>

          {popupAds.button_link && (
            <a
              href={popupAds.button_link}
              onClick={(e) => {
                e.preventDefault();
                if (popupAds) dismissPopup(popupAds.id);
              }}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-[#d7ff53] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:bg-[#c7ef33] transition-all duration-200"
            >
              {popupAds.button_text || "Kunjungi"}
              <span className="ml-2">→</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Default export for ClientLayout usage
export default PopupAds;