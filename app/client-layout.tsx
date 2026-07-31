"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/components/AuthProvider";
import { CartProvider } from "@/components/CartProvider";
import { LoginModalProvider } from "@/components/LoginModalProvider";
import { LocaleProvider } from "@/components/LocaleProvider";
import { ToastProvider } from "@/components/Toast";
import PopupWrapper from "@/components/PopupWrapper";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <LoginModalProvider>
            <LocaleProvider>
              <CartProvider>
                <PopupWrapper>{children}</PopupWrapper>
              </CartProvider>
            </LocaleProvider>
          </LoginModalProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}