"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabasePublic } from "@/lib/supabasePublic";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

// Only allow same-origin path redirects to prevent open-redirect abuse.
function safeRedirectTarget(input: string | null | undefined): string {
  if (!input) return "/";
  if (!input.startsWith("/")) return "/";
  if (input.startsWith("//")) return "/";
  if (input === "/login" || input === "/register") return "/";
  return input;
}

export default function LoginPage() {
  const router = useRouter();
  const { signIn, session, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [redirectTo, setRedirectTo] = useState("/");
  const hasAutoRedirectedRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectTo(safeRedirectTarget(params.get("redirectTo")));
  }, []);

  // If user is already signed in, send them to the safe target. Skip while
  // AuthProvider is still bootstrapping the session to avoid a redirect
  // loop on first render.
  useEffect(() => {
    if (authLoading) return;
    if (session && !hasAutoRedirectedRef.current) {
      hasAutoRedirectedRef.current = true;
      router.replace(safeRedirectTarget(redirectTo));
    }
  }, [authLoading, session, redirectTo, router]);

  function validatePassword() {
    if (password && password.length < 8) {
      setPasswordError("Kata sandi minimal 8 karakter");
      return false;
    }
    setPasswordError("");
    return true;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email wajib diisi");
      return;
    }

    if (!password) {
      setError("Kata sandi wajib diisi");
      return;
    }

    if (password.length < 8) {
      setPasswordError("Kata sandi minimal 8 karakter");
      return;
    }

    setLoading(true);

    try {
      const result = await Promise.race([
        signIn(email.trim(), password),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("LOGIN_TIMEOUT")), 15000)
        ),
      ]);

      if (result) {
        if (result.message.includes("Invalid login credentials")) {
          setError("Email atau kata sandi salah");
        } else if (result.message.includes("Email not confirmed")) {
          setError("Email Anda belum diverifikasi. Silakan periksa kotak masuk Anda.");
        } else {
          setError(result.message || "Gagal masuk.");
        }
        return;
      }

      // Confirm session is actually live before navigating.
      const { data: { session: freshSession } } = await supabasePublic.auth.getSession();
      if (!freshSession) {
        setError("Sesi tidak terbentuk. Coba lagi.");
        return;
      }

      const target = safeRedirectTarget(redirectTo);
      hasAutoRedirectedRef.current = true;
      router.replace(target);
      router.refresh();
    } catch (err) {
      if (err instanceof Error && err.message === "LOGIN_TIMEOUT") {
        setError("Proses login terlalu lama. Periksa koneksi dan coba lagi.");
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleForgotPassword() {
    const adminPhone = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "6281234567890";
    let msg = encodeURIComponent("Halo Admin, saya ingin meminta bantuan untuk mengatur ulang kata sandi akun saya.");
    if (email.trim()) {
      msg = encodeURIComponent(`Halo Admin, saya ingin meminta bantuan untuk mengatur ulang kata sandi akun dengan email ${email.trim()}.`);
    }
    window.open(`https://wa.me/${adminPhone}?text=${msg}`, "_blank");
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 py-12">
      <div className="mx-auto max-w-md space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <ArrowLeft size={14} />
          Kembali ke Beranda
        </Link>

        <div className="text-center">
          <h1 className="text-2xl font-black tracking-[0.25em] text-white">WALI</h1>
          <p className="mt-2 text-sm text-white/50">Masuk ke akun Anda</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-white/80">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#d7ff53] focus:ring-1 focus:ring-[#d7ff53]/30"
                placeholder="nama@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-white/80">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); validatePassword(); setError(""); }}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#d7ff53] focus:ring-1 focus:ring-[#d7ff53]/30"
                  placeholder="Minimal 8 karakter"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white/70"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && <p className="mt-1.5 text-xs text-red-400">{passwordError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#d7ff53] px-4 py-3 text-sm font-black text-black transition hover:bg-[#c7ef33] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  Memproses...
                </span>
              ) : (
                "Masuk"
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-white/50 underline transition hover:text-[#d7ff53]"
              >
                Lupa Kata Sandi?
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-white/10 pt-4 text-center text-sm text-white/50">
            Belum punya akun?{" "}
            <Link href="/register" className="font-bold text-[#d7ff53] underline">
              Daftar sekarang
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
