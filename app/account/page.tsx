"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabasePublic } from "@/lib/supabasePublic";
import { useAuth } from "@/hooks/useAuth";
import { uploadProfileImage, deleteProfileImage } from "@/lib/profile-image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import {
  ArrowLeft,
  Camera,
  Check,
  Edit2,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  User as UserIcon,
  Calendar,
  X,
} from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  birth_date: string | null;
  gender: string | null;
  profile_image_url: string | null;
  email_confirmed_at: string | null;
  updated_at: string | null;
}

function resolveDisplayName(
  profile: { full_name?: string | null } | null | undefined,
  user: { email?: string | null; user_metadata?: Record<string, unknown> | null } | null | undefined
): string {
  const fromProfile = profile?.full_name?.trim();
  if (fromProfile) return fromProfile;
  const fromMeta = (user?.user_metadata?.full_name as string | undefined)?.trim();
  if (fromMeta) return fromMeta;
  const email = user?.email ?? "";
  const local = email.includes("@") ? email.split("@")[0] : email;
  return local || "Pengguna";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function orPlaceholder(value: string | null | undefined, placeholder = "Belum diisi"): string {
  const v = (value ?? "").toString().trim();
  if (!v) return placeholder;
  return v;
}

function formatDateID(value: string | null | undefined): string {
  if (!value) return "Belum diisi";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Belum diisi";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function formatGender(value: string | null | undefined): string {
  if (!value) return "Belum diisi";
  if (value === "male") return "Laki-laki";
  if (value === "female") return "Perempuan";
  if (value === "other") return "Lainnya";
  return value;
}

function getAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export default function AccountPage() {
  const { session, user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Auth gate: wait for AuthProvider to settle, then redirect if no session.
  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      router.replace("/login?redirectTo=/account");
    }
  }, [authLoading, session, router]);

  useEffect(() => {
    if (session) fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, session]);

  async function fetchProfile() {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabasePublic
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("fetchProfile error:", error.message);
        setToast({ type: "error", msg: "Gagal memuat profil" });
        return;
      }

      let row: UserProfile | null = (data as UserProfile | null) ?? null;

      if (!row) {
        // On-the-fly backfill for accounts created before the trigger / backfill
        // migration. Phone is NOT NULL UNIQUE — fall back to a per-user
        // placeholder so the upsert never collides.
        const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
        const full_name = (meta.full_name as string) || session.user.email?.split("@")[0] || "Pengguna";
        const phone = (((meta.phone as string) || "").trim()) || `pending:${session.user.id}`;
        const address = (meta.address as string) || "-";

        const { data: created, error: insertErr } = await supabasePublic
          .from("profiles")
          .upsert({
            id: session.user.id,
            full_name,
            phone,
            email: session.user.email || "",
            address,
            birth_date: (meta.birth_date as string) || null,
            gender: (meta.gender as string) || null,
            is_email_verified: Boolean(session.user.email_confirmed_at),
          })
          .select()
          .maybeSingle();

        if (insertErr || !created) {
          console.error("fetchProfile upsert error:", insertErr?.message);
          setToast({ type: "error", msg: "Gagal memuat profil" });
          return;
        }
        row = created as UserProfile;
      }

      const full: UserProfile = {
        ...row,
        email: session.user.email || row.email || "",
        email_confirmed_at: session.user.email_confirmed_at || row.email_confirmed_at,
      };
      setProfile(full);
      setEditForm(full);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("fetchProfile:", message);
      setToast({ type: "error", msg: "Gagal memuat profil" });
    } finally {
      setLoading(false);
    }
  }

  function startEdit() {
    setEditForm({
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
      birth_date: profile?.birth_date || "",
      gender: profile?.gender || "",
    });
    setEditing(true);
  }

  async function saveProfile() {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const { error } = await supabasePublic
        .from("profiles")
        .update({
          full_name: editForm.full_name?.trim(),
          phone: editForm.phone?.trim().replace(/[\s-]/g, ""),
          address: editForm.address?.trim(),
          birth_date: editForm.birth_date || null,
          gender: editForm.gender || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;
      await fetchProfile();
      setEditing(false);
      setToast({ type: "success", msg: "Profil berhasil diperbarui" });
    } catch {
      setToast({ type: "error", msg: "Gagal memperbarui profil" });
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    setUploading(true);
    try {
      if (profile.profile_image_url) {
        await deleteProfileImage(profile.profile_image_url);
      }
      const result = await uploadProfileImage(profile.id, file);
      if (!result.success || !result.url) {
        throw new Error(result.error || "Upload gagal");
      }
      const { error: updateError } = await supabasePublic
        .from("profiles")
        .update({ profile_image_url: result.url })
        .eq("id", profile.id);
      if (updateError) throw updateError;
      await fetchProfile();
      setToast({ type: "success", msg: "Foto profil berhasil diperbarui" });
    } catch {
      setToast({ type: "error", msg: "Gagal mengunggah foto profil" });
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    if (!profile?.profile_image_url || !profile.id) return;
    try {
      await deleteProfileImage(profile.profile_image_url);
      await supabasePublic
        .from("profiles")
        .update({ profile_image_url: null })
        .eq("id", profile.id);
      await fetchProfile();
      setToast({ type: "success", msg: "Foto profil dihapus" });
    } catch {
      setToast({ type: "error", msg: "Gagal menghapus foto profil" });
    }
  }

  const handleLogout = useCallback(async () => {
    await signOut();
    router.replace("/");
  }, [signOut, router]);

  function getAvatarUrl(url: string | null) {
    if (!url) return "";
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars${url}`;
  }

  // Show full-screen loader while we don't yet know if user is signed in.
  if (authLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#0b0b0b] text-white">
          <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-32">
            <p className="flex items-center gap-3 text-white/60">
              <Loader2 className="h-5 w-5 animate-spin" /> Memuat...
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // No session → auth gate redirects, render nothing in the meantime.
  if (!session) {
    return null;
  }

  const displayName = resolveDisplayName(profile, user);
  const initials = getInitials(displayName);
  const age = getAge(profile?.birth_date);
  const avatarSrc = profile?.profile_image_url ? getAvatarUrl(profile.profile_image_url) : "";

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#0b0b0b] text-white">
        <section className="border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
          <div className="mx-auto max-w-4xl px-4 py-10 md:px-8 md:py-14">
            <Breadcrumb items={[{ label: "Akun Saya" }]} />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-wide text-white md:text-4xl">
                  Akun Saya
                </h1>
                <p className="mt-2 max-w-xl text-sm text-white/55">
                  Kelola informasi profil, foto, dan data pribadi Anda. Semua perubahan tersimpan aman di akun Anda.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/70 transition hover:border-white/30 hover:text-white"
              >
                <ArrowLeft size={14} />
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-10 md:px-8 md:py-14">
          {toast && (
            <div
              className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                toast.type === "success"
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
              }`}
            >
              {toast.msg}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-12">
              <p className="flex items-center gap-3 text-white/60">
                <Loader2 className="h-5 w-5 animate-spin" /> Memuat profil...
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {/* Profile card */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
                <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-white/10 ring-2 ring-white/10">
                    {avatarSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarSrc}
                        alt={displayName}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-black text-white/60">
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-xl font-black text-white">{displayName}</h2>
                    <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-white/55">
                      <Mail size={14} className="shrink-0" /> {user?.email || profile?.email || "Belum diisi"}
                    </p>
                    {profile?.email_confirmed_at ? (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-green-400">
                        <Check size={12} /> Email Terverifikasi
                      </span>
                    ) : (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-yellow-400">
                        Email Belum Diverifikasi
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/70 transition hover:border-[#d7ff53]/50 hover:text-[#d7ff53]">
                      <Camera size={14} />
                      {uploading ? "Mengunggah..." : "Ganti Foto"}
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    {profile?.profile_image_url && (
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-400 transition hover:border-red-500/50"
                        title="Hapus foto profil"
                      >
                        <X size={14} /> Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Info / Edit card */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/55">
                    Data Pribadi
                  </h3>
                  {!editing && (
                    <button
                      type="button"
                      onClick={startEdit}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/80 transition hover:border-[#d7ff53]/50 hover:text-[#d7ff53]"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                  )}
                </div>

                {!editing ? (
                  <ul className="divide-y divide-white/5">
                    <InfoRow icon={UserIcon} label="Nama Lengkap" value={orPlaceholder(profile?.full_name)} />
                    <InfoRow icon={Mail} label="Email" value={orPlaceholder(user?.email || profile?.email)} />
                    <InfoRow icon={Phone} label="No. HP" value={orPlaceholder(profile?.phone)} />
                    <InfoRow icon={MapPin} label="Alamat" value={orPlaceholder(profile?.address)} />
                    <InfoRow
                      icon={Calendar}
                      label="Tanggal Lahir"
                      value={formatDateID(profile?.birth_date)}
                      meta={age !== null ? `${age} tahun` : undefined}
                    />
                    <InfoRow
                      label="Jenis Kelamin"
                      value={formatGender(profile?.gender)}
                    />
                  </ul>
                ) : (
                  <div className="space-y-4">
                    <Field
                      label="Nama Lengkap"
                      value={editForm.full_name || ""}
                      onChange={(v) => setEditForm({ ...editForm, full_name: v })}
                    />
                    <Field
                      label="No. HP"
                      type="tel"
                      value={editForm.phone || ""}
                      onChange={(v) => setEditForm({ ...editForm, phone: v })}
                    />
                    <Field
                      label="Alamat"
                      multiline
                      value={editForm.address || ""}
                      onChange={(v) => setEditForm({ ...editForm, address: v })}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Tanggal Lahir"
                        type="date"
                        value={editForm.birth_date || ""}
                        onChange={(v) => setEditForm({ ...editForm, birth_date: v })}
                      />
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/50">
                          Jenis Kelamin
                        </label>
                        <select
                          value={editForm.gender || ""}
                          onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#d7ff53] focus:ring-1 focus:ring-[#d7ff53]/30"
                        >
                          <option value="" className="bg-[#0b0b0b]">Pilih</option>
                          <option value="male" className="bg-[#0b0b0b]">Laki-laki</option>
                          <option value="female" className="bg-[#0b0b0b]">Perempuan</option>
                          <option value="other" className="bg-[#0b0b0b]">Lainnya</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        type="button"
                        onClick={saveProfile}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#d7ff53] px-5 py-3 text-sm font-black text-black transition hover:bg-[#c7ef33] disabled:opacity-50"
                      >
                        <Save size={14} /> {saving ? "Menyimpan..." : "Simpan"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        disabled={saving}
                        className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-50"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/10"
              >
                <LogOut size={16} /> Keluar dari Akun
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  meta,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  meta?: string;
}) {
  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      {Icon ? (
        <Icon size={16} className="mt-0.5 shrink-0 text-white/35" />
      ) : (
        <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full bg-white/10" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
          {label}
        </p>
        <p className={`mt-1 text-sm ${value === "Belum diisi" ? "text-white/40" : "text-white"}`}>
          {value}
          {meta && <span className="ml-2 text-xs text-white/40">({meta})</span>}
        </p>
      </div>
    </li>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/50">
        {label}
      </label>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#d7ff53] focus:ring-1 focus:ring-[#d7ff53]/30"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#d7ff53] focus:ring-1 focus:ring-[#d7ff53]/30"
        />
      )}
    </div>
  );
}
