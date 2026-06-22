"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";

type Props = {
  action: () => Promise<void>;
  className?: string;
  variant?: "default" | "mobile";
};

export default function AdminLogoutButton({ action, className = "", variant = "default" }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={() => {
        startTransition(async () => {
          await action();
        });
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        className={
          variant === "mobile"
            ? `w-full rounded-2xl border border-white/10 px-4 py-4 text-sm font-black uppercase tracking-wider text-white/80 transition hover:bg-white hover:text-black disabled:opacity-50 ${className}`
            : `rounded-full bg-white px-5 py-2 text-sm font-black text-black transition hover:scale-105 hover:bg-[#d7ff53] disabled:opacity-50 ${className}`
        }
      >
        {variant === "mobile" ? (
          <span className="inline-flex items-center justify-center gap-2">
            <LogOut size={16} /> Logout
          </span>
        ) : isPending ? (
          "..."
        ) : (
          "Logout"
        )}
      </button>
    </form>
  );
}
