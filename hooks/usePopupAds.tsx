"use client";

import { useState, useEffect } from "react";
import { supabasePublic } from "@/lib/supabasePublic";
import { useAuth } from "@/hooks/useAuth";

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

export function usePopupAds() {
  const { session } = useAuth();
  const [popupAds, setPopupAds] = useState<PopupAd | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPopupAds();
  }, [session]);

  const fetchPopupAds = async () => {
    try {
      // Fetch all active popups
      const { data, error } = await supabasePublic
        .from("popup_ads")
        .select("*")
        .eq("status", true)
        .order("sort_order", { ascending: true });

      if (error) throw new Error(error.message);

      console.log("[PopupAds] Fetched data:", data, "Session:", !!session);

      if (!data || data.length === 0) {
        console.log("[PopupAds] No active popups found in DB");
        setPopupAds(null);
        setIsLoading(false);
        return;
      }

      // Find first popup that matches user audience
      const matchingPopup = data.find((p: any) => {
        const audience = p.audience || "logged_in";
        if (audience === "all") return true;
        if (audience === "logged_in") return !!session;
        if (audience === "guest") return !session;
        return false;
      });

      console.log("[PopupAds] Matching popup:", matchingPopup);

      if (!matchingPopup) {
        console.log("[PopupAds] No popup for current audience");
        setPopupAds(null);
        setIsLoading(false);
        return;
      }

      // Check if user already dismissed this popup and TTL hasn't expired
      const dismissedKey = `popup_dismissed_${matchingPopup.id}`;
      const dismissedAt = localStorage.getItem(dismissedKey);
      let shouldShow = true;

      if (dismissedAt) {
        const minutesAgo = Math.floor(
          (Date.now() - Number(dismissedAt)) / (1000 * 60)
        );
        shouldShow = minutesAgo > matchingPopup.dismiss_minutes;
        console.log("[PopupAds] Dismissed", minutesAgo, "min ago, TTL:", matchingPopup.dismiss_minutes, "shouldShow:", shouldShow);
      }

      if (shouldShow) {
        setPopupAds({
          id: matchingPopup.id,
          title: matchingPopup.title,
          subtitle: matchingPopup.subtitle || "",
          body: matchingPopup.body,
          image_url: matchingPopup.image_url || "",
          button_text: matchingPopup.button_text || "Kunjungi",
          button_link: matchingPopup.button_link || "/",
          position: matchingPopup.position || "center",
          audience: matchingPopup.audience || "logged_in",
          dismiss_minutes: matchingPopup.dismiss_minutes || 60,
        });
      } else {
        setPopupAds(null);
      }
    } catch (err) {
      console.error("ERROR LOADING POPUP ADS:", err);
      setPopupAds(null);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissPopup = (adId: number) => {
    if (!adId) return;
    const dismissedKey = `popup_dismissed_${adId}`;
    localStorage.setItem(dismissedKey, Date.now().toString());
    setPopupAds(null);
  };

  return { popupAds, isLoading, dismissPopup };
}