"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
};

export default function LoginModal({ open, onClose, onLoginSuccess }: LoginModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setError("");
      setEmail("");
      setPassword("");
      setShowPassword(false);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 px-4"
      onClick={handleBackdropClick}
    >
      {/* Modal */}
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-wide text-gray-900">
            {mode === "login" ? "Login" : "Daftar Akun"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Toggle */}
        <p className="mt-3 text-sm text-gray-500">
          {mode === "login" ? (
            <>
              Belum punya akun?{" "}
              <button
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                className="font-bold text-black underline"
              >
                Daftar sekarang
              </button>
            </>
          ) : (
            <>
              Sudah punya akun?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="font-bold text-black underline"
              >
                Login
              </button>
            </>
          )}
        </p>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Login Form */}
        {mode === "login" && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setError("");

              try {
                const { supabasePublic } = await import("@/lib/supabasePublic");
                const { error } = await supabasePublic.auth.signInWithPassword({
                  email,
                  password,
                });

                if (error) {
                  if (error.message.includes("Invalid login credentials")) {
                    setError("Email atau kata sandi salah.");
                  } else if (error.message.includes("Email not confirmed")) {
                    setError(
                      "Email belum diverifikasi. Periksa inbox dan klik link verifikasi."
                    );
                  } else {
                    setError(error.message);
                  }
                  return;
                }

                onLoginSuccess();
                onClose();
              } catch (err: any) {
                setError(err.message || "Gagal login.");
              } finally {
                setLoading(false);
              }
            }}
          >
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="login-email" className="mb-1 block text-xs font-bold text-gray-600">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 placeholder-gray-400 transition focus:border-[#d7ff53] focus:outline-none"
                  placeholder="email@contoh.com"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="mb-1 block text-xs font-bold text-gray-600">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm font-semibold text-gray-900 placeholder-gray-400 transition focus:border-[#d7ff53] focus:outline-none"
                    placeholder="Min. 8 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Forgot Password -> WhatsApp */}
            <div className="mt-3">
              <ForgotPasswordLink email={email} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-[#0b0b0b] px-6 py-3 text-sm font-black uppercase tracking-wider text-[#d7ff53] transition hover:bg-[#1a1a1a] disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Login"}
            </button>
          </form>
        )}

        {/* Register Form */}
        {mode === "register" && (
          <RegisterForm
            onClose={onClose}
            onLoginSuccess={onLoginSuccess}
            setError={setError}
          />
        )}
      </div>
    </div>
  );
}

function ForgotPasswordLink({ email }: { email: string }) {
  const adminPhone = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "6281234567890";
  let msg = "Halo Admin, saya ingin meminta bantuan untuk mengatur ulang kata sandi akun saya.";
  if (email.trim()) {
    msg = `Halo Admin, saya ingin meminta bantuan untuk mengatur ulang kata sandi akun dengan email ${email.trim()}.`;
  }
  const url = `https://wa.me/${adminPhone}?text=${encodeURIComponent(msg)}`;

  return (
    <button
      type="button"
      onClick={() => {
        window.open(url, "_blank", "noopener,noreferrer");
      }}
      className="text-xs font-semibold text-gray-500 underline underline-offset-2 hover:text-[#d7ff53]"
    >
      Lupa Kata Sandi?
    </button>
  );
}

function RegisterForm({
  onClose,
  onLoginSuccess,
  setError,
}: {
  onClose: () => void;
  onLoginSuccess: () => void;
  setError: (msg: string) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setProfileImage(null);
      return;
    }

    // Validate format
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Format foto tidak valid. Gunakan JPG, PNG, atau WebP.");
      return;
    }

    // Validate size (2 MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran foto terlalu besar. Maksimal 2 MB.");
      return;
    }

    setProfileImage(file);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Client-side validation
    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      setLoading(false);
      return;
    }

    if (!agreeTerms) {
      setError("Anda harus menyetujui kebijakan privasi untuk melanjutkan.");
      setLoading(false);
      return;
    }

    try {
      const { supabasePublic } = await import("@/lib/supabasePublic");

      // Sign up via Supabase Auth
      const { data: authData, error: authError } = await supabasePublic.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            address,
            birth_date: birthDate || null,
            gender: gender || null,
          },
        },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes("already registered")) {
          setError("Email ini sudah terdaftar.");
        } else if (authError.message.toLowerCase().includes("weird") || authError.message.toLowerCase().includes("suspicious")) {
          setError("Terdeteksi aktivitas mencurigakan. Coba beberapa saat lagi atau gunakan perangkat lain.");
        } else if (authError.message.toLowerCase().includes("rate limit")) {
          setError("Terlalu banyak percobaan. Tunggu beberapa saat sebelum mencoba lagi.");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Gagal membuat akun. Coba lagi.");
        setLoading(false);
        return;
      }

      // Upload profile image if provided
      let imageUrl: string | null = null;
      if (profileImage && authData.user.id) {
        const ext = profileImage.name.split(".").pop() || "jpg";
        const fileName = `${authData.user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabasePublic.storage
          .from("avatars")
          .upload(fileName, profileImage, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabasePublic.storage
            .from("avatars")
            .getPublicUrl(fileName);
          imageUrl = urlData?.publicUrl || null;
        }
        // Don't block signup if upload fails silently
      }

      // Create profile row
      const { error: profileError } = await supabasePublic
        .from("profiles")
        .insert({
          user_id: authData.user.id,
          email,
          full_name: fullName,
          phone,
          address,
          birth_date: birthDate || null,
          gender: gender || null,
          avatar_url: imageUrl,
        })
        .select()
        .single();

      if (profileError) {
        setError("Gagal membuat profil. Silakan coba lagi.");
        setLoading(false);
        return;
      }

      // Sign in immediately after signup
      const { error: signInError } = await supabasePublic.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("Pendaftaran berhasil, tapi gagal masuk otomatis. Silakan login.");
        setLoading(false);
        return;
      }

      onLoginSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal mendaftar.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
      {/* Avatar Upload */}
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center">
          {profileImage ? (
            <img src={URL.createObjectURL(profileImage)} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-black text-gray-400">
              {fullName.trim().charAt(0).toUpperCase() || "?"}
            </span>
          )}
        </div>
        <label className="cursor-pointer text-xs font-bold text-gray-500 underline hover:text-gray-700">
          Unggah Foto
          <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
        </label>
        {profileImage && (
          <button type="button" onClick={() => setProfileImage(null)} className="text-xs text-red-500 underline">Hapus</button>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold text-gray-600">Nama Lengkap *</label>
        <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:border-[#d7ff53] focus:outline-none" placeholder="Nama lengkap" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-600">Email *</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:border-[#d7ff53] focus:outline-none" placeholder="email@contoh.com" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-600">No. HP *</label>
        <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:border-[#d7ff53] focus:outline-none" placeholder="08xxxxxxxxxx" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-600">Alamat Lengkap *</label>
        <textarea required value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:border-[#d7ff53] focus:outline-none" placeholder="Alamat lengkap" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-gray-600">Tanggal Lahir</label>
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 focus:border-[#d7ff53] focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-gray-600">Jenis Kelamin</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 focus:border-[#d7ff53] focus:outline-none">
            <option value="">Pilih</option>
            <option value="male">Laki-laki</option>
            <option value="female">Perempuan</option>
            <option value="other">Lainnya</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-600">Kata Sandi *</label>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:border-[#d7ff53] focus:outline-none" placeholder="Min. 8 karakter" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600">{showPassword ? "Hide" : "Show"}</button>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-600">Konfirmasi Kata Sandi *</label>
        <div className="relative">
          <input type={showConfirm ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:border-[#d7ff53] focus:outline-none" placeholder="Ulangi kata sandi" />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600">{showConfirm ? "Hide" : "Show"}</button>
        </div>
      </div>
      <label className="flex items-start gap-2 text-xs text-gray-600">
        <input type="checkbox" required checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-[#d7ff53] focus:ring-[#d7ff53]" />
        <span>
          Saya menyetujui{" "}
          <Link href="/privacy-policy" className="font-bold underline hover:text-[#d7ff53]">
            Kebijakan Privasi
          </Link>
          WALI Merch.
        </span>
      </label>
      <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#0b0b0b] px-6 py-3 text-sm font-black uppercase tracking-wider text-[#d7ff53] transition hover:bg-[#1a1a1a] disabled:opacity-50">
        {loading ? "Memproses..." : "Daftar"}
      </button>
    </form>
  );
}
