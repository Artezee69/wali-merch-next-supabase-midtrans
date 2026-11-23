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
  Camera,
  Check,
  Edit2,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Save,
  User as UserIcon,
  Calendar,
  X,
  ChevronRight,
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
  created_at: string | null;
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

  if (authLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
          <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-32">
            <p className="flex items-center gap-3 text-white/50">
              <Loader2 className="h-5 w-5 animate-spin" /> Memuat...
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

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

      <main className="min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        {/* ── Page header ── */}
        <section className="border-b border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent">
          <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
            <Breadcrumb items={[{ label: "Akun Saya" }]} />
            <div className="mt-6">
              <p
                className="mb-2 text-[11px] font-black uppercase tracking-[0.25em]"
                style={{ color: "var(--accent-color)" }}
              >
                Panel Akun
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1
                    className="text-3xl font-black uppercase tracking-tight md:text-4xl"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Akun Saya
                  </h1>
                  <p className="mt-2 max-w-xl text-sm" style={{ color: "var(--text-secondary)" }}>
                    Kelola informasi profil, foto, dan data pribadi Anda.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Main content ── */}
        <section className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
          {toast && (
            <div
              className={`mb-6 flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-bold ${
                toast.type === "success"
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
              }`}
            >
              {toast.msg}
              <button
                type="button"
                onClick={() => setToast(null)}
                className="ml-4 shrink-0 text-[10px] font-black uppercase tracking-wider opacity-70 hover:opacity-100"
              >
                Tutup
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-20">
              <p className="flex items-center gap-3 text-white/50">
                <Loader2 className="h-5 w-5 animate-spin" /> Memuat profil...
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-5">
              {/* Left column (3/5): Profile + Personal Data */}
              <div className="space-y-6 lg:col-span-3">
                {/* ── Profile hero card ── */}
                <div
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                >
                  <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center md:p-8">
                    {/* Avatar */}
                    <div className="shrink-0">
                      <div
                        className="relative h-24 w-24 overflow-hidden rounded-2xl md:h-28 md:w-28"
                        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}
                      >
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
                          <div
                            className="flex h-full w-full items-center justify-center text-3xl font-black"
                            style={{ color: "var(--accent-color)" }}
                          >
                            {initials}
                          </div>
                        )}
                        {profile?.email_confirmed_at ? (
                          <span className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-lg">
                            <Check size={13} />
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <label
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/60 transition hover:border-[#d7ff53]/40 hover:text-[#d7ff53]"
                        >
                          <Camera size={12} />
                          {uploading ? "Unggah..." : "Foto"}
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
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-red-400 transition hover:bg-red-500/20"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Identity */}
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                        {displayName}
                      </h2>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 text-white/50">
                          <Mail size={13} className="shrink-0" />
                          {user?.email || profile?.email || "Belum diisi"}
                        </span>
                        {profile?.phone && (
                          <span className="inline-flex items-center gap-1.5 text-white/50">
                            <Phone size={13} className="shrink-0" />
                            {profile.phone}
                          </span>
                        )}
                      </div>
                      <div className="mt-4">
                        {profile?.email_confirmed_at ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-green-400">
                            <Check size={11} /> Email Terverifikasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-yellow-400">
                            Email Belum Diverifikasi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Personal data card ── */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <h3
                      className="text-[11px] font-black uppercase tracking-[0.25em]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Data Pribadi
                    </h3>
                    {!editing && (
                      <button
                        type="button"
                        onClick={startEdit}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/60 transition hover:border-[#d7ff53]/40 hover:text-[#d7ff53]"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    )}
                  </div>

                  {!editing ? (
                    <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
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
                      <InfoRow label="Jenis Kelamin" value={formatGender(profile?.gender)} />
                    </div>
                  ) : (
                    <div className="space-y-5">
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
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                          label="Tanggal Lahir"
                          type="date"
                          value={editForm.birth_date || ""}
                          onChange={(v) => setEditForm({ ...editForm, birth_date: v })}
                        />
                        <div>
                          <label
                            className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Jenis Kelamin
                          </label>
                          <select
                            value={editForm.gender || ""}
                            onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[#d7ff53]/40"
                            style={{ color: "var(--text-primary)" }}
                          >
                            <option value="">Pilih</option>
                            <option value="male">Laki-laki</option>
                            <option value="female">Perempuan</option>
                            <option value="other">Lainnya</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <button
                          type="button"
                          onClick={saveProfile}
                          disabled={saving}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#d7ff53] px-5 py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-white disabled:opacity-50"
                        >
                          <Save size={14} /> {saving ? "Menyimpan..." : "Simpan"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(false)}
                          disabled={saving}
                          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white/60 transition hover:bg-white/10 disabled:opacity-50"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Orders link card ── */}
                <Link
                  href="/account/orders"
                  className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#d7ff53]/30 hover:bg-white/[0.06] md:p-6"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#d7ff53]"
                    >
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide" style={{ color: "var(--text-primary)" }}>
                        Pesanan Saya
                      </p>
                      <p className="mt-0.5 text-xs text-white/45">
                        Lihat riwayat dan status semua pesanan
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-[#d7ff53]"
                  />
                </Link>
              </div>

              {/* Right column (2/5): Account meta + Logout */}
              <div className="space-y-6 lg:col-span-2">
                {/* ── Account info card ── */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <h3
                    className="mb-5 text-[11px] font-black uppercase tracking-[0.25em]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Akun
                  </h3>
                  <div className="space-y-4">
                    <MetaRow icon={Mail} metaLabel="Email" value={user?.email || "—"} />
                    <MetaRow
                      icon={Calendar}
                      metaLabel="Bergabung"
                      value={
                        profile?.created_at
                          ? new Date(profile.created_at).toLocaleDateString("id-ID", {
                              month: "short",
                              year: "numeric",
                            })
                          : "—"
                      }
                    />
                    <MetaRow
                      icon={Phone}
                      metaLabel="No. HP"
                      value={orPlaceholder(profile?.phone)}
                    />
                    <MetaRow
                      icon={MapPin}
                      metaLabel="Alamat"
                      value={orPlaceholder(profile?.address)}
                    />
                  </div>
                </div>

                {/* ── Danger zone ── */}
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                  <h3 className="mb-4 text-[11px] font-black uppercase tracking-[0.25em] text-red-400/80">
                    Pengaturan
                  </h3>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 text-sm font-black uppercase tracking-wider text-red-400 transition hover:bg-red-500/20"
                  >
                    <LogOut size={16} /> Keluar dari Akun
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}

/* ── Sub-components ── */

function MetaRow({
  icon: Icon,
  metaLabel,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  metaLabel: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
        <Icon size={15} className="text-[#d7ff53]" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/40">{metaLabel}</p>
        <p className="mt-0.5 truncate text-sm font-bold text-white/80">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label: rowLabel,
  value,
  meta,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  meta?: string;
}) {
  const isPlaceholder = value === "Belum diisi";
  return (
    <div className="flex items-start gap-3 border-b border-white/5 py-3 first:pt-0 last:border-0 last:pb-0">
      {Icon ? (
        <Icon size={15} className="mt-0.5 shrink-0 text-white/35" />
      ) : (
        <span className="mt-1 h-4 w-4 shrink-0 rounded-full bg-white/10" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/40">{rowLabel}</p>
        <p
          className={`mt-0.5 text-sm ${isPlaceholder ? "italic text-white/35" : "font-bold text-white/85"}`}
        >
          {value}
          {meta && <span className="ml-2 text-xs font-normal text-white/40">({meta})</span>}
        </p>
      </div>
    </div>
  );
}

function Field({
  label: fieldLabel,
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
      <label
        className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-white/50"
      >
        {fieldLabel}
      </label>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#d7ff53]/40"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#d7ff53]/40"
        />
      )}
    </div>
  );
}
