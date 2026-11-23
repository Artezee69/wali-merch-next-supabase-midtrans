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

  // If user is already signed in, send them to the safe target.
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
    const adminPhone = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "6285134894580";
    let msg = encodeURIComponent("Halo Admin, saya ingin meminta bantuan untuk mengatur ulang kata sandi akun saya.");
    if (email.trim()) {
      msg = encodeURIComponent(`Halo Admin, saya ingin meminta bantuan untuk mengatur ulang kata sandi akun dengan email ${email.trim()}.`);
    }
    window.open(`https://wa.me/${adminPhone}?text=${msg}`, "_blank");
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6"
      style={{
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      {/* Ambient glow layers */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[38%] -z-10 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.06]"
        style={{ background: "radial-gradient(circle, var(--accent-color) 0%, transparent 65%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[12%] top-[18%] -z-10 h-[220px] w-[220px] rounded-full opacity-[0.03]"
        style={{ background: "radial-gradient(circle, var(--accent-color) 0%, transparent 60%)" }}
      />

      <div className="w-full max-w-[400px]">
        {/* Brand mark */}
        <div className="mb-10 text-center">
          <h1
            className="text-4xl font-black tracking-[0.4em] sm:text-[42px]"
            style={{ color: "var(--text-primary)" }}
          >
            WALI
          </h1>
          <p className="mt-3 text-[13px] font-medium tracking-wide" style={{ color: "var(--text-secondary)" }}>
            Masuk ke akun Anda untuk melanjutkan
          </p>
        </div>

        {/* Glass card */}
        <div
          className="rounded-[24px] border p-6 backdrop-blur-2xl sm:p-8"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-color)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.03), 0 40px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Error alert */}
          {error && (
            <div
              className="mb-6 rounded-xl border px-4 py-3 text-[13px] font-medium"
              style={{
                background: "color-mix(in srgb, var(--danger-color) 10%, transparent)",
                borderColor: "color-mix(in srgb, var(--danger-color) 30%, transparent)",
                color: "var(--danger-color)",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="mb-2 block text-[11px] font-bold uppercase tracking-[0.1em]"
                style={{ color: "var(--text-secondary)" }}
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="nama@email.com"
                required
                className="w-full rounded-2xl border px-5 py-4 text-[15px] outline-none transition-all duration-300 placeholder:opacity-35"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.08)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-color)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 4px color-mix(in srgb, var(--accent-color) 10%, transparent)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[12px] font-medium transition-colors hover:opacity-80"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Lupa sandi?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    validatePassword();
                    setError("");
                  }}
                  placeholder="Masukkan kata sandi"
                  required
                  className="w-full rounded-2xl border px-5 py-4 pr-14 text-[15px] outline-none transition-all duration-300 placeholder:opacity-35"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderColor: "rgba(255,255,255,0.08)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-color)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 4px color-mix(in srgb, var(--accent-color) 10%, transparent)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-70"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-2 text-[12px] font-medium" style={{ color: "var(--danger-color)" }}>
                  {passwordError}
                </p>
              )}
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl py-4 text-[15px] font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: "var(--accent-color)",
                color: "var(--bg-primary)",
                boxShadow:
                  "0 12px 32px -8px color-mix(in srgb, var(--accent-color) 45%, transparent), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2.5">
                  <span
                    className="inline-block h-4 w-4 animate-spin rounded-full border-[2.5px]"
                    style={{
                      borderColor: "color-mix(in srgb, var(--bg-primary) 30%, transparent)",
                      borderTopColor: "var(--bg-primary)",
                    }}
                  />
                  Memproses…
                </span>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* Register link */}
          <div className="mt-7 text-center">
            <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              Belum punya akun?{" "}
            </span>
            <Link
              href="/register"
              className="text-[13px] font-bold transition-colors hover:opacity-80"
              style={{ color: "var(--accent-color)" }}
            >
              Daftar
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:opacity-70"
            style={{ color: "var(--text-secondary)" }}
          >
            <ArrowLeft size={14} />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
