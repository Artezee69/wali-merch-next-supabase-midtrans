"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabasePublic } from "@/lib/supabasePublic";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Loader2, User, Phone, Mail, Lock, MapPin, Calendar, FileText, CheckCircle, ArrowLeft } from "lucide-react";

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

  // Availability
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
    else if (fullName.trim().length < 3) errs.fullName = "Nama minimal 3 karakter";

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

  // Debounced email availability
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
      if (seq !== emailCheckSeq.current) return;
      if (email.trim().toLowerCase() !== trimmed) return;
      if (result.emailExists === true) {
        setEmailTaken(true);
        setEmailAvailable(false);
      } else if (result.emailExists === false) {
        setEmailTaken(false);
        setEmailAvailable(true);
      } else {
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

  // Debounced phone availability
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

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim().replace(/[\s-]/g, "");
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    const phoneValid = /^(\+62|62|0)8[1-9][0-9]{7,11}$/.test(normalizedPhone);

    const result = await checkAvailability({
      email: emailValid ? normalizedEmail : undefined,
      phone: phoneValid ? normalizedPhone : undefined,
    });

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

  // Shared input styles
  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
    color: "var(--text-primary)",
  };

  const labelClass = "mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em]";
  const inputClass =
    "w-full rounded-2xl border px-5 py-4 text-[15px] outline-none transition-all duration-300 placeholder:opacity-35";

  // --- SUCCESS STATE ---
  if (success) {
    return (
      <main
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 sm:px-6"
        style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[40%] -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, var(--accent-color) 0%, transparent 65%)" }}
        />

        <div className="w-full max-w-[400px] space-y-8 text-center">
          {/* Checkmark */}
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border backdrop-blur-2xl"
            style={{
              background: "color-mix(in srgb, var(--accent-color) 8%, transparent)",
              borderColor: "color-mix(in srgb, var(--accent-color) 25%, transparent)",
              boxShadow: "0 0 40px -8px color-mix(in srgb, var(--accent-color) 20%, transparent)",
            }}
          >
            <CheckCircle size={40} style={{ color: "var(--accent-color)" }} />
          </div>

          <div>
            <h1 className="text-[28px] font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Pendaftaran Berhasil!
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Kami sudah mengirim email verifikasi ke{" "}
              <span className="font-bold" style={{ color: "var(--text-primary)" }}>{email}</span>
            </p>
            <p className="mt-2 text-[13px] leading-relaxed opacity-60" style={{ color: "var(--text-secondary)" }}>
              Silakan cek kotak masuk (dan folder spam) untuk memverifikasi email Anda sebelum masuk.
            </p>
          </div>

          {/* Resend */}
          <div
            className="rounded-2xl border p-5 backdrop-blur-2xl"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-color)",
            }}
          >
            <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
              Belum menerima email?
            </p>
            <button
              onClick={resendVerification}
              className="mt-3 w-full rounded-xl border py-3 text-[14px] font-bold transition-all duration-200 hover:opacity-80"
              style={{
                borderColor: "var(--border-color)",
                background: "rgba(255,255,255,0.04)",
                color: "var(--text-primary)",
              }}
            >
              Kirim Ulang Email Verifikasi
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 text-[13px]">
            <Link href="/login" className="font-bold transition-colors hover:opacity-80" style={{ color: "var(--accent-color)" }}>
              Masuk
            </Link>
            <span className="opacity-30">·</span>
            <Link href="/" className="font-medium transition-colors hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
              Beranda
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // --- FORM ---
  return (
    <main
      className="relative min-h-screen overflow-hidden px-4 py-12 sm:px-6 sm:py-16"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[12%] -z-10 h-[380px] w-[380px] -translate-x-1/2 rounded-full opacity-[0.05]"
        style={{ background: "radial-gradient(circle, var(--accent-color) 0%, transparent 60%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[8%] bottom-[15%] -z-10 h-[200px] w-[200px] rounded-full opacity-[0.03]"
        style={{ background: "radial-gradient(circle, var(--accent-color) 0%, transparent 60%)" }}
      />

      <div className="mx-auto w-full max-w-[440px]">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1
            className="text-[40px] font-black tracking-[0.35em] sm:text-[44px]"
            style={{ color: "var(--text-primary)" }}
          >
            WALI
          </h1>
          <p className="mt-3 text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
            Buat akun untuk mengakses semua fitur
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
          {/* General error */}
          {errors._general && (
            <div
              className="mb-6 rounded-xl border px-4 py-3 text-[13px] font-medium"
              style={{
                background: "color-mix(in srgb, var(--danger-color) 10%, transparent)",
                borderColor: "color-mix(in srgb, var(--danger-color) 30%, transparent)",
                color: "var(--danger-color)",
              }}
            >
              {errors._general}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6" noValidate>
            {/* Full Name */}
            <div>
              <label className={labelClass} style={{ color: "var(--text-secondary)" }}>
                <User size={12} /> Nama Lengkap
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                style={{
                  ...inputStyle,
                  borderColor: errors.fullName ? "color-mix(in srgb, var(--danger-color) 40%, transparent)" : inputStyle.borderColor,
                }}
                placeholder="Nama lengkap Anda"
              />
              {errors.fullName && (
                <p className="mt-1.5 text-[12px] font-medium" style={{ color: "var(--danger-color)" }}>{errors.fullName}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className={labelClass} style={{ color: "var(--text-secondary)" }}>
                <Phone size={12} /> Nomor HP
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                style={{
                  ...inputStyle,
                  borderColor: errors.phone || phoneTaken
                    ? "color-mix(in srgb, var(--danger-color) 40%, transparent)"
                    : inputStyle.borderColor,
                }}
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
              <label className={labelClass} style={{ color: "var(--text-secondary)" }}>
                <Mail size={12} /> Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                className={inputClass}
                style={{
                  ...inputStyle,
                  borderColor: errors.email || emailTaken
                    ? "color-mix(in srgb, var(--danger-color) 40%, transparent)"
                    : inputStyle.borderColor,
                }}
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
              <label className={labelClass} style={{ color: "var(--text-secondary)" }}>
                <Lock size={12} /> Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-14`}
                  style={{
                    ...inputStyle,
                    borderColor: errors.password
                      ? "color-mix(in srgb, var(--danger-color) 40%, transparent)"
                      : inputStyle.borderColor,
                  }}
                  placeholder="Minimal 8 karakter"
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
              {errors.password && (
                <p className="mt-1.5 text-[12px] font-medium" style={{ color: "var(--danger-color)" }}>{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className={labelClass} style={{ color: "var(--text-secondary)" }}>
                <Lock size={12} /> Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputClass} pr-14`}
                  style={{
                    ...inputStyle,
                    borderColor: errors.confirmPassword
                      ? "color-mix(in srgb, var(--danger-color) 40%, transparent)"
                      : inputStyle.borderColor,
                  }}
                  placeholder="Ulangi kata sandi"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-70"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-[12px] font-medium" style={{ color: "var(--danger-color)" }}>{errors.confirmPassword}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className={labelClass} style={{ color: "var(--text-secondary)" }}>
                <MapPin size={12} /> Alamat Lengkap
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
                style={{
                  ...inputStyle,
                  borderColor: errors.address
                    ? "color-mix(in srgb, var(--danger-color) 40%, transparent)"
                    : inputStyle.borderColor,
                }}
                placeholder="Jl. ..., RT/RW, Kelurahan, Kecamatan, Kota"
              />
              {errors.address && (
                <p className="mt-1.5 text-[12px] font-medium" style={{ color: "var(--danger-color)" }}>{errors.address}</p>
              )}
            </div>

            {/* Birth Date + Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={{ color: "var(--text-secondary)" }}>
                  <Calendar size={12} /> Tgl Lahir
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={inputClass}
                  style={{
                    ...inputStyle,
                    borderColor: errors.birthDate
                      ? "color-mix(in srgb, var(--danger-color) 40%, transparent)"
                      : inputStyle.borderColor,
                  }}
                />
                {errors.birthDate && (
                  <p className="mt-1.5 text-[12px] font-medium" style={{ color: "var(--danger-color)" }}>{errors.birthDate}</p>
                )}
              </div>
              <div>
                <label className={labelClass} style={{ color: "var(--text-secondary)" }}>
                  Jenis Kelamin
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={`${inputClass} appearance-none`}
                  style={{
                    ...inputStyle,
                    borderColor: errors.gender
                      ? "color-mix(in srgb, var(--danger-color) 40%, transparent)"
                      : inputStyle.borderColor,
                    color: gender ? "var(--text-primary)" : "color-mix(in srgb, var(--text-primary) 40%, transparent)",
                  }}
                >
                  <option value="" disabled hidden>Pilih</option>
                  <option value="male" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>Laki-laki</option>
                  <option value="female" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>Perempuan</option>
                  <option value="other" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>Lainnya</option>
                </select>
                {errors.gender && (
                  <p className="mt-1.5 text-[12px] font-medium" style={{ color: "var(--danger-color)" }}>{errors.gender}</p>
                )}
              </div>
            </div>

            {/* Avatar */}
            <div>
              <label className={labelClass} style={{ color: "var(--text-secondary)" }}>
                <FileText size={12} /> Foto Profil
                <span className="normal-case opacity-40" style={{ fontWeight: 400, letterSpacing: "normal" }}>(opsional)</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setAvatarFile(file);
                }}
                className="w-full cursor-pointer rounded-2xl border px-5 py-4 text-[13px] file:mr-4 file:rounded-xl file:border-0 file:px-4 file:py-2.5 file:text-[12px] file:font-bold file:uppercase file:tracking-wider"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.08)",
                  color: "var(--text-secondary)",
                }}
              />
              {errors.avatar && (
                <p className="mt-1.5 text-[12px] font-medium" style={{ color: "var(--danger-color)" }}>{errors.avatar}</p>
              )}
            </div>

            {/* Privacy Policy */}
            <div>
              <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={agreePolicy}
                  onChange={(e) => setAgreePolicy(e.target.checked)}
                  className="mt-0.5 h-[18px] w-[18px] rounded border-0"
                  style={{ accentColor: "var(--accent-color)" }}
                />
                <span>
                  Saya menyetujui{" "}
                  <Link href="/privacy" className="font-bold underline underline-offset-4" style={{ color: "var(--accent-color)" }}>
                    Kebijakan Privasi
                  </Link>{" "}
                  dan bersedia data pribadi saya diproses sesuai ketentuan.
                </span>
              </label>
              {errors.policy && (
                <p className="ml-[30px] mt-1.5 text-[12px] font-medium" style={{ color: "var(--danger-color)" }}>{errors.policy}</p>
              )}
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={loading || emailTaken || phoneTaken}
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
                  <Loader2 className="h-[18px] w-[18px] animate-spin" /> Memproses…
                </span>
              ) : (
                "Daftar"
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-7 text-center">
            <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              Sudah punya akun?{" "}
            </span>
            <Link
              href="/login"
              className="text-[13px] font-bold transition-colors hover:opacity-80"
              style={{ color: "var(--accent-color)" }}
            >
              Masuk
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
      <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Memeriksa…
      </p>
    );
  }
  if (taken) {
    return (
      <p className="mt-2 text-[12px] font-medium" style={{ color: "var(--danger-color)" }}>{takenText}</p>
    );
  }
  if (available) {
    return (
      <p className="mt-2 flex items-center gap-1 text-[12px] font-medium" style={{ color: "var(--accent-color)" }}>
        <CheckCircle size={12} />
        {availableText}
      </p>
    );
  }
  return null;
}
