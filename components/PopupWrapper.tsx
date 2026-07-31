"use client";

import { useAuth } from "@/hooks/useAuth";
import PopupAds from "./PopupAds";

export default function PopupWrapper({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();

  // Popup will be rendered for logged-in users. The PopupAds component
  // internally checks the session and popup's audience setting to decide
  // whether to display.
  return (
    <>
      {children}
      <PopupAds />
    </>
  );
}