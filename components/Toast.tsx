"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  show: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = Math.random().toString(36).slice(2, 10);
    setToasts((prev) => [...prev, { id, message, variant }]);

    // Auto-hide after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}

      {/* Toast Container */}
      <div
        aria-live="assertive"
        className="fixed bottom-4 right-4 z-[9999] flex w-full max-w-sm flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={dismiss}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const bgColor =
    toast.variant === "success"
      ? "border-l-[#d7ff53]"
      : toast.variant === "error"
        ? "border-l-red-500"
        : "border-l-blue-400";
  const textColor =
    toast.variant === "success"
      ? "text-[#d7ff53]"
      : toast.variant === "error"
        ? "text-red-400"
        : "text-blue-400";

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border-l-4 bg-white/90 px-4 py-3 text-sm font-semibold text-gray-900 shadow-lg transition-all ${bgColor}`}
    >
      <div className={`flex-1 ${textColor}`}>
        {toast.message}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-gray-400 transition hover:text-gray-700"
        aria-label="Tutup"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M3 3l8 8M11 3l-8 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
