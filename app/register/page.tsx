"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabasePublic } from "@/lib/supabasePublic";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Loader2, User, Phone, Mail, Lock, MapPin, Calendar, FileText } from "lucide-react";

type AvailabilityResult = {
  emailExists: boolean | null;
  phoneExists: boolean | null;
  error?: string;
};

async function checkAvailability(input: {
  email?: string;
  phone?: string;
  signal?: AbortSignal;
}): Promise<AvailabilityResult> {
  try {
    const res = await fetch("/api/check-availability", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: input.email, phone: input.phone }),
      cache: "no-store",
      signal: input.signal,
    });
    const data = (await res.json()) as {
      emailExists?: boolean;
      phoneExists?: boolean;
      available?: boolean;
      email?: { available?: boolean };
      phone?: { available?: boolean };
      error?: string;
    };

    if (!res.ok) {
      return {
        emailExists: null,
        phoneExists: null,
        error: data.error || "Gagal memeriksa ketersediaan",
      };
    }

    // New contract: top-level booleans. Fall back to the legacy nested shape
    // for older API responses.
    const emailExists =
      typeof data.emailExists === "boolean"
        ? data.emailExists
        : data.email && typeof data.email.available === "boolean"
        ? !data.email.available
        : null;
    const phoneExists =
      typeof data.phoneExists === "boolean"
        ? data.phoneExists
        : data.phone && typeof data.phone.available === "boolean"
        ? !data.phone.available
        : null;

    // eslint-disable-next-line no-console
    console.log("Availability response:", { emailExists, phoneExists });

    return { emailExists, phoneExists };
  } catch (err) {
    return {
      emailExists: null,
      phoneExists: null,
      error: "Gagal memeriksa ketersediaan",
    };
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [searchRedirectTo, setSearchRedirectTo] = useState("");
  const { signUp, session } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Availability status for email & phone (debounced async check)
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);
  const [phoneTaken, setPhoneTaken] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(false);
  const [phoneAvailable, setPhoneAvailable] = useState(false);
  const emailCheckSeq = useRef(0);
  const phoneCheckSeq = useRef(0);

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      router.replace(searchRedirectTo ? decodeURIComponent(searchRedirectTo) : "/account");
    }
  }, [session, router, searchRedirectTo]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchRedirectTo(params.get("redirectTo") || "");
  }, []);

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!fullName.trim()) errs.fullName = "Nama lengkap wajib diisi";
    if (fullName.trim().length < 3) errs.fullName = "Nama minimal 3 karakter";

    if (!phone.trim()) errs.phone = "Nomor HP wajib diisi";
    else if (!/^(\+62|62|0)8[1-9][0-9]{7,11}$/.test(phone.trim().replace(/[\s-]/g, "")))
      errs.phone = "Format nomor HP tidak valid";
    else if (phoneTaken) errs.phone = "Nomor HP ini sudah terdaftar. Silakan gunakan nomor lain.";

    if (!email.trim()) errs.email = "Email wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = "Format email tidak valid";
    else if (emailTaken) errs.email = "Email ini sudah terdaftar. Silakan gunakan email lain.";

    if (!password) errs.password = "Kata sandi wajib diisi";
    else if (password.length < 8) errs.password = "Kata sandi minimal 8 karakter";

    if (!confirmPassword) errs.confirmPassword = "Konfirmasi kata sandi wajib diisi";
    else if (password !== confirmPassword) errs.confirmPassword = "Kata sandi tidak cocok";

    if (!address.trim()) errs.address = "Alamat wajib diisi";
    else if (address.trim().length < 10) errs.address = "Alamat minimal 10 karakter";

    if (!birthDate) errs.birthDate = "Tanggal lahir wajib diisi";

    if (!gender) errs.gender = "Jenis kelamin wajib diisi";

    if (!agreePolicy) errs.policy = "Anda harus menyetujui kebijakan privasi";

    // File validation
    if (avatarFile) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(avatarFile.type))
        errs.avatar = "Format file tidak valid. Gunakan JPG, PNG, atau WebP";
      else if (avatarFile.size > 2 * 1024 * 1024)
        errs.avatar = "Ukuran file maksimal 2 MB";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Debounced async check: is the email already registered?
  useEffect(() => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailTaken(false);
      setEmailAvailable(false);
      setCheckingEmail(false);
      return;
    }
    setCheckingEmail(true);
    const seq = ++emailCheckSeq.current;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const result = await checkAvailability({
        email: trimmed,
        signal: controller.signal,
      });
      // Bail out if a newer check started, the input changed, or the
      // request was aborted — never let a stale response flip a fresh
      // input's state.
      if (seq !== emailCheckSeq.current) return;
      if (email.trim().toLowerCase() !== trimmed) return;
      if (result.emailExists === true) {
        setEmailTaken(true);
        setEmailAvailable(false);
      } else if (result.emailExists === false) {
        setEmailTaken(false);
        setEmailAvailable(true);
      } else {
        // null = server error; don't claim taken, but also don't claim free.
        setEmailTaken(false);
        setEmailAvailable(false);
        if (result.error) {
          setErrors((prev) => ({ ...prev, _general: result.error! }));
        }
      }
      setCheckingEmail(false);
    }, 600);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [email]);

  // Debounced async check: is the phone already registered?
  useEffect(() => {
    const normalized = phone.trim().replace(/[\s-]/g, "");
    if (!/^(\+62|62|0)8[1-9][0-9]{7,11}$/.test(normalized)) {
      setPhoneTaken(false);
      setPhoneAvailable(false);
      setCheckingPhone(false);
      return;
    }
    setCheckingPhone(true);
    const seq = ++phoneCheckSeq.current;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const result = await checkAvailability({
        phone: normalized,
        signal: controller.signal,
      });
      if (seq !== phoneCheckSeq.current) return;
      if (phone.trim().replace(/[\s-]/g, "") !== normalized) return;
      if (result.phoneExists === true) {
        setPhoneTaken(true);
        setPhoneAvailable(false);
      } else if (result.phoneExists === false) {
        setPhoneTaken(false);
        setPhoneAvailable(true);
      } else {
        setPhoneTaken(false);
        setPhoneAvailable(false);
        if (result.error) {
          setErrors((prev) => ({ ...prev, _general: result.error! }));
        }
      }
      setCheckingPhone(false);
    }, 600);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [phone]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    // Re-check uniqueness right before submit (debounced check may not have
    // resolved, or the user may have changed the field after the last check).
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim().replace(/[\s-]/g, "");
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    const phoneValid = /^(\+62|62|0)8[1-9][0-9]{7,11}$/.test(normalizedPhone);

    const result = await checkAvailability({
      email: emailValid ? normalizedEmail : undefined,
      phone: phoneValid ? normalizedPhone : undefined,
    });

    // If the request itself failed, surface a general error and stop —
    // never mark both fields as "taken" on a server error.
    if (result.emailExists == null && result.phoneExists == null) {
      setErrors((prev) => ({
        ...prev,
        _general: result.error || "Gagal memeriksa email dan nomor HP.",
      }));
      return;
    }

    const newErrors: Record<string, string> = {};
    if (result.emailExists === true) {
      newErrors.email = "Email ini sudah terdaftar. Silakan gunakan email lain.";
    }
    if (result.phoneExists === true) {
      newErrors.phone = "Nomor HP ini sudah terdaftar. Silakan gunakan nomor lain.";
    }
    setEmailTaken(result.emailExists === true);
    setPhoneTaken(result.phoneExists === true);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!validate()) return;

    setLoading(true);

    const signUpResult = await signUp({
      email: email.trim().toLowerCase(),
      password,
      full_name: fullName.trim(),
      phone: phone.trim().replace(/[\s-]/g, ""),
      address: address.trim(),
      birth_date: birthDate || null,
      gender: (gender || null) as "male" | "female" | "other" | null,
      privacy_accepted: agreePolicy,
      avatar: avatarFile,
    });

    if (signUpResult.error) {
      if (signUpResult.error.includes("already registered")) {
        setErrors({ email: "Email ini sudah terdaftar. Silakan gunakan email lain." });
      } else if (signUpResult.error.includes("Invalid email")) {
        setErrors({ email: "Format email tidak valid" });
      } else {
        setErrors({ _general: signUpResult.error });
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setEmailSent(true);
    setLoading(false);
  }

  async function resendVerification() {
    const { error } = await supabasePublic.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
    });

    if (error) {
      setErrors({ _general: "Gagal mengirim ulang email verifikasi." });
    } else {
      setErrors({ _general: null as any });
    }
  }

  // --- SUCCESS STATE ---
  if (success) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] px-4 py-16">
        <div className="mx-auto max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white">Pendaftaran Berhasil!</h1>
          <p className="text-sm text-white/60">
            Kami sudah mengirim email verifikasi ke{" "}
            <span className="font-semibold text-white">{email}</span>
          </p>
          <p className="text-sm text-white/50">
            Silakan cek kotak masuk (dan folder spam) untuk memverifikasi email Anda sebelum masuk.
          </p>

          {!emailSent && (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-400">
              Verifikasi email sudah aktif untuk akun ini. Anda bisa langsung masuk.
              <div className="mt-3">
                <Link href="/login" className="font-bold text-[#d7ff53] underline">
                  Langsung masuk →
                </Link>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
            <p className="mb-3 text-white/80">Belum diverifikasi?</p>
            <button
              onClick={resendVerification}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/15"
            >
              Kirim Ulang Email Verifikasi
            </button>
          </div>

          <div className="text-sm">
            <Link href="/" className="font-bold text-[#d7ff53] underline">
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // --- FORM ---
  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 py-16">
      <div className="mx-auto max-w-md space-y-6">

        {/* Logo */}
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-[0.25em] text-white">WALI</h1>
          <p className="mt-2 text-sm text-white/50">Buat akun baru</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
          {errors._general && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errors._general}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-white/80">
                <User size={14} /> Nama Lengkap
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#d7ff53] focus:ring-1 focus:ring-[#d7ff53]/30 ${
                  errors.fullName ? "border-red-500/50" : "border-white/10"
                }`}
                placeholder="Nama lengkap Anda"
              />
              {errors.fullName && <p className="mt-1.5 text-xs text-red-400">{errors.fullName}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-white/80">
                <Phone size={14} /> Nomor HP
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#d7ff53] focus:ring-1 focus:ring-[#d7ff53]/30 ${
                  errors.phone
                    ? "border-red-500/50"
                    : phoneTaken
                    ? "border-red-500/50"
                    : "border-white/10"
                }`}
                placeholder="08xxxxxxxxxx"
              />
              <FieldStatus
                loading={checkingPhone}
                taken={phoneTaken}
                available={phoneAvailable && !phoneTaken && !errors.phone}
                takenText="Nomor HP ini sudah terdaftar."
                availableText="Nomor HP tersedia."
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-white/80">
                <Mail size={14} /> Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#d7ff53] focus:ring-1 focus:ring-[#d7ff53]/30 ${
                  errors.email
                    ? "border-red-500/50"
                    : emailTaken
                    ? "border-red-500/50"
                    : "border-white/10"
                }`}
                placeholder="nama@email.com"
              />
              <FieldStatus
                loading={checkingEmail}
                taken={emailTaken}
                available={emailAvailable && !emailTaken && !errors.email}
                takenText="Email ini sudah terdaftar."
                availableText="Email tersedia."
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-white/80">
                <Lock size={14} /> Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full rounded-xl border bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#d7ff53] focus:ring-1 focus:ring-[#d7ff53]/30 ${
                    errors.password ? "border-red-500/50" : "border-white/10"
                  }`}
                  placeholder="Minimal 8 karakter"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-white/80">
                <Lock size={14} /> Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full rounded-xl border bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#d7ff53] focus:ring-1 focus:ring-[#d7ff53]/30 ${
                    errors.confirmPassword ? "border-red-500/50" : "border-white/10"
                  }`}
                  placeholder="Ulangi kata sandi"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword}</p>}
            </div>

            {/* Address */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-white/80">
                <MapPin size={14} /> Alamat Lengkap
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#d7ff53] focus:ring-1 focus:ring-[#d7ff53]/30 ${
                  errors.address ? "border-red-500/50" : "border-white/10"
                }`}
                placeholder="Jl. ..., RT/RW, Kelurahan, Kecamatan, Kota"
              />
              {errors.address && <p className="mt-1.5 text-xs text-red-400">{errors.address}</p>}
            </div>

            {/* Birth Date + Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-white/80">
                  <Calendar size={14} /> Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#d7ff53] focus:ring-1 focus:ring-[#d7ff53]/30 ${
                    errors.birthDate ? "border-red-500/50" : "border-white/10"
                  }`}
                />
                {errors.birthDate && <p className="mt-1.5 text-xs text-red-400">{errors.birthDate}</p>}
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-white/80">
                  Jenis Kelamin
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#d7ff53] focus:ring-1 focus:ring-[#d7ff53]/30 ${
                    errors.gender ? "border-red-500/50" : "border-white/10"
                  }`}
                >
                  <option value="" className="bg-[#0b0b0b] text-white/40">Pilih</option>
                  <option value="male" className="bg-[#0b0b0b]">Laki-laki</option>
                  <option value="female" className="bg-[#0b0b0b]">Perempuan</option>
                  <option value="other" className="bg-[#0b0b0b]">Lainnya</option>
                </select>
                {errors.gender && <p className="mt-1.5 text-xs text-red-400">{errors.gender}</p>}
              </div>
            </div>

            {/* Avatar */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-white/80">
                Foto Profil <span className="text-white/30 font-normal">(opsional)</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setAvatarFile(file);
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-white/15"
              />
              {errors.avatar && <p className="mt-1.5 text-xs text-red-400">{errors.avatar}</p>}
            </div>

            {/* Privacy Policy */}
            <div>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={agreePolicy}
                  onChange={(e) => setAgreePolicy(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/5 text-[#d7ff53] focus:ring-[#d7ff53]/30"
                />
                <span>
                  Saya menyetujui{" "}
                  <Link href="/privacy" className="text-[#d7ff53] underline">
                    Kebijakan Privasi
                  </Link>{" "}
                  dan bersedia data pribadi saya diproses sesuai ketentuan.
                </span>
              </label>
              {errors.policy && <p className="mt-1.5 ml-7 text-xs text-red-400">{errors.policy}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || emailTaken || phoneTaken}
              className="w-full rounded-xl bg-[#d7ff53] px-4 py-3 text-sm font-black text-black transition hover:bg-[#c7ef33] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
                </span>
              ) : (
                "Daftar"
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-white/10 pt-4 text-center text-sm text-white/50">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-bold text-[#d7ff53] underline">
              Masuk
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

type FieldStatusProps = {
  loading: boolean;
  taken: boolean;
  available: boolean;
  takenText: string;
  availableText: string;
};

function FieldStatus({ loading, taken, available, takenText, availableText }: FieldStatusProps) {
  if (loading) {
    return (
      <p className="mt-1 flex items-center gap-1 text-xs text-white/40">
        <Loader2 className="h-3 w-3 animate-spin" />
        Memeriksa...
      </p>
    );
  }
  if (taken) {
    return <p className="mt-1 text-xs text-red-400">{takenText}</p>;
  }
  if (available) {
    return <p className="mt-1 text-xs text-emerald-400">{availableText}</p>;
  }
  return null;
}
