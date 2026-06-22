"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/hooks/useAuth";

type OpenOptions = {
  mode?: "login" | "register";
  redirectTo?: string;
};

type LoginModalContextValue = {
  open: (opts?: OpenOptions) => void;
  close: () => void;
};

const LoginModalContext = createContext<LoginModalContextValue | null>(null);

export function useLoginModal() {
  const ctx = useContext(LoginModalContext);
  if (!ctx) {
    // Allow callers outside a provider to no-op gracefully instead of crashing —
    // older pages might still mount without the provider.
    return {
      open: () => {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      },
      close: () => {},
    };
  }
  return ctx;
}

function sameOriginPath(input: string | null | undefined): string {
  if (!input) return "";
  if (!input.startsWith("/")) return "";
  if (input.startsWith("//")) return "";
  if (input === "/login" || input === "/register") return "";
  return input;
}

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, session } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [redirectTo, setRedirectTo] = useState<string>("");

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const show = useCallback(
    (opts?: OpenOptions) => {
      const target = sameOriginPath(opts?.redirectTo) || pathname || "/";
      setMode(opts?.mode ?? "login");
      setRedirectTo(target);
      setOpen(true);
    },
    [pathname]
  );

  // If the user signs in (e.g. inside the modal), close automatically.
  useEffect(() => {
    if (open && (user || session)) {
      setOpen(false);
    }
  }, [open, user, session]);

  const handleLoginSuccess = useCallback(() => {
    const target = sameOriginPath(redirectTo) || "/";
    setOpen(false);
    router.replace(target);
    router.refresh();
  }, [redirectTo, router]);

  return (
    <LoginModalContext.Provider value={{ open: show, close }}>
      {children}
      <LoginModal
        open={open}
        onClose={close}
        onLoginSuccess={handleLoginSuccess}
        // Keep the inner LoginModal in sync with our mode if it ever exposes it.
        // The component is currently self-contained; the link buttons inside
        // (Login/Daftar in the modal) still work because the modal handles its
        // own mode toggling.
      />
    </LoginModalContext.Provider>
  );
}
