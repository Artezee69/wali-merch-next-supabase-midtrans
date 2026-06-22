"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Globe, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

type Props = {
  initialError?: string;
};

export default function LoginForm({ initialError }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "same-origin",
      });

      if (res.ok) {
        // Force a full-page navigation so the new Set-Cookie headers are
        // sent on the very next request and server components re-render
        // with the fresh session. router.replace() would race the cookie
        // write and bounce back to /admin/login. The cache-buster query
        // string avoids any chance of an Edge/HTML cache serving a
        // pre-login snapshot of /admin.
        window.location.assign(`/admin?_=${Date.now()}`);
        return;
      }

      let message = "Login gagal. Coba lagi.";
      try {
        const data = (await res.json()) as { error?: string };
        if (data?.error) message = data.error;
      } catch {
        /* response was not JSON; keep the generic message */
      }
      setError(message);
      setLoading(false);
    } catch {
      setError("Tidak bisa menghubungi server. Periksa koneksi Anda.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-300 sm:rounded-2xl sm:p-4 sm:text-sm">
          <AlertCircle
            size={16}
            strokeWidth={2.5}
            className="mt-0.5 shrink-0"
          />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="admin-email"
          className="mb-2 block text-[10px] font-black uppercase tracking-widest text-white/40 sm:text-xs"
        >
          Email Admin
        </label>
        <div className="relative">
          <Mail
            size={16}
            strokeWidth={2.2}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            id="admin-email"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder="admin@wali.id"
            className="w-full rounded-xl border border-white/10 bg-black/50 py-3 pl-11 pr-4 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#d7ff53] disabled:opacity-60 sm:rounded-2xl sm:py-4 sm:pl-12"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="mb-2 block text-[10px] font-black uppercase tracking-widest text-white/40 sm:text-xs"
        >
          Password
        </label>
        <div className="relative">
          <Lock
            size={16}
            strokeWidth={2.2}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            id="admin-password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            placeholder="Masukkan password admin"
            className="w-full rounded-xl border border-white/10 bg-black/50 py-3 pl-11 pr-4 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#d7ff53] disabled:opacity-60 sm:rounded-2xl sm:py-4 sm:pl-12"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#d7ff53] px-7 py-3.5 text-xs font-black uppercase tracking-wider text-black transition active:scale-95 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70 sm:px-7 sm:py-4 sm:text-sm"
      >
        {loading && (
          <Loader2
            size={14}
            strokeWidth={2.5}
            className="animate-spin"
            aria-hidden="true"
          />
        )}
        {loading ? "Memeriksa..." : "Login Admin"}
      </button>

      <Link
        href="/"
        className="flex w-full items-center justify-center gap-1.5 rounded-full border border-white/10 px-7 py-3.5 text-center text-xs font-black uppercase tracking-wider text-white/60 transition hover:border-white hover:bg-white hover:text-black sm:px-7 sm:py-4 sm:text-sm"
      >
        <Globe size={12} strokeWidth={2.5} className="sm:hidden" />
        <Globe size={14} strokeWidth={2.5} className="hidden sm:block" />
        Back To Website
      </Link>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:rounded-2xl sm:p-4">
        <p className="text-[10px] font-bold leading-5 text-white/45 sm:text-xs sm:leading-6">
          Akses admin membutuhkan akun dengan role{" "}
          <span className="text-[#d7ff53]">admin</span> di tabel{" "}
          <span className="text-[#d7ff53]">profiles</span>. Hubungi pemilik
          toko jika belum memiliki akses.
        </p>
      </div>
    </form>
  );
}
