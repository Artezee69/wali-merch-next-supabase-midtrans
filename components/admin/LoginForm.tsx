"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertTriangle, Globe, Loader2, Lock, Mail } from "lucide-react";
import { Alert, AdminButton } from "@/components/admin/ui";

type Props = {
  initialError?: string;
};

const inp = "ad-input";

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
        <Alert tone="error" onClose={() => setError(null)}>
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </Alert>
      )}

      <div>
        <label
          htmlFor="admin-email"
          className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--ad-text-2)]"
        >
          Email Admin
        </label>
        <div className="relative">
          <Mail
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ad-text-3)]"
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
            className={`${inp} pl-10`}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--ad-text-2)]"
        >
          Password
        </label>
        <div className="relative">
          <Lock
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ad-text-3)]"
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
            className={`${inp} pl-10`}
          />
        </div>
      </div>

      <AdminButton type="submit" variant="primary" disabled={loading} className="w-full !py-3">
        {loading && <Loader2 size={14} className="animate-spin" />}
        {loading ? "Memeriksa…" : "Login Admin"}
      </AdminButton>

      <Link
        href="/"
        className="ad-btn ad-btn-secondary w-full !py-3 text-[13px]"
      >
        <Globe size={14} />
        Back To Website
      </Link>

      <div className="rounded-lg border border-[var(--ad-border)] bg-[var(--ad-surface-2)] p-3.5">
        <p className="text-[11.5px] leading-5 text-[var(--ad-text-3)]">
          Akses admin membutuhkan akun dengan role{" "}
          <span className="font-semibold text-[var(--ad-accent)]">admin</span> di tabel{" "}
          <span className="font-mono text-[10.5px] font-semibold text-[var(--ad-accent)]">profiles</span>.
          Hubungi pemilik toko jika belum memiliki akses.
        </p>
      </div>
    </form>
  );
}
