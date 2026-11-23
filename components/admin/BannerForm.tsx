"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  CalendarClock,
  Eye,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Type,
  Upload,
  X,
} from "lucide-react";
import {
  createBanner,
  updateBanner,
  type BannerFormState,
} from "@/app/admin/banners/actions";
import {
  AdminButton,
  Alert,
  Field,
  Pill,
  Section,
} from "@/components/admin/ui";

type BannerFocusPoint =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

type BannerInitial = {
  id?: number;
  title: string;
  subtitle: string | null;
  image_url: string;
  storage_path: string;
  button_text: string | null;
  button_link: string | null;
  position: "hero" | "right_top" | "right_bottom";
  sort_order: number;
  status: boolean;
  start_date: string | null;
  end_date: string | null;
  focus_point?: BannerFocusPoint;
};

const FOCUS_OPTIONS: { value: BannerFocusPoint; label: string }[] = [
  { value: "center", label: "Tengah" },
  { value: "top", label: "Atas" },
  { value: "bottom", label: "Bawah" },
  { value: "left", label: "Kiri" },
  { value: "right", label: "Kanan" },
  { value: "top-left", label: "Atas-Kiri" },
  { value: "top-right", label: "Atas-Kanan" },
  { value: "bottom-left", label: "Bawah-Kiri" },
  { value: "bottom-right", label: "Bawah-Kanan" },
];

type Props = {
  mode: "create" | "edit";
  initial?: BannerInitial;
};

function toDateTimeLocal(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

const inp = "ad-input";

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <AdminButton variant="primary" disabled={pending}>
      {pending && <Loader2 size={13} className="animate-spin" />}
      {pending ? "Menyimpan…" : mode === "create" ? "Buat Banner" : "Simpan Perubahan"}
    </AdminButton>
  );
}

export default function BannerForm({ mode, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<BannerFormState | null>(null);
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [storagePath, setStoragePath] = useState(initial?.storage_path ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const initialStartDate = toDateTimeLocal(initial?.start_date ?? null);
  const initialEndDate = toDateTimeLocal(initial?.end_date ?? null);

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/banners/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Upload gagal");
      }
      setImageUrl(json.url);
      setStoragePath(json.path);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleRemoveImage() {
    setImageUrl("");
    setStoragePath("");
    setUploadError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState(null);
    const form = e.currentTarget;
    const fd = new FormData(form);

    // Inject upload values into form
    fd.set("image_url", imageUrl);
    fd.set("storage_path", storagePath);

    startTransition(async () => {
      try {
        const result =
          mode === "create" || !initial?.id
            ? await createBanner(state, fd)
            : await updateBanner(initial.id, state, fd);
        setState(result);
        if (result.ok) {
          router.push("/admin/banners");
          router.refresh();
        }
      } catch (err) {
        setState({
          ok: false,
          error: err instanceof Error ? err.message : "Gagal menyimpan.",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <nav className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--ad-text-3)]">
        <Link href="/admin" className="hover:text-[var(--ad-text)]">Admin</Link>
        <span>/</span>
        <Link href="/admin/banners" className="hover:text-[var(--ad-text)]">Banner</Link>
        <span>/</span>
        <span className="text-[var(--ad-text)]">{mode === "create" ? "Tambah Baru" : "Edit"}</span>
      </nav>

      {state && !state.ok && (
        <Alert tone="error" onClose={() => setState(null)}>
          {state.error}
        </Alert>
      )}

      <Section title="Gambar Banner" icon={<ImageIcon size={14} />} open onToggle={() => {}} accent="#2563eb">
        <div className="grid gap-4 sm:grid-cols-[1fr_300px]">
          <div className="overflow-hidden rounded-xl border border-[var(--ad-border)] bg-[var(--ad-surface-2)]">
            {imageUrl ? (
              <div className="relative overflow-hidden rounded-xl bg-black/90">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="block h-auto w-full max-h-[400px] object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="ad-btn ad-btn-danger ad-btn-sm absolute right-2.5 top-2.5 shadow"
                >
                  <X size={11} /> Hapus
                </button>
              </div>
            ) : (
              <div className="flex aspect-[16/9] flex-col items-center justify-center text-[var(--ad-text-3)]">
                <ImageIcon size={28} strokeWidth={1.5} />
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide">
                  Belum ada gambar
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="ad-btn ad-btn-secondary w-fit cursor-pointer">
              <Upload size={13} />
              {uploading ? "Mengupload…" : "Pilih Gambar"}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChosen}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <p className="text-[11.5px] leading-5 text-[var(--ad-text-3)]">
              Format: PNG, JPG, WebP, SVG, atau GIF. Maksimal 5MB. Gambar lama
              di storage otomatis terhapus saat upload gambar baru.
            </p>
            <div className="rounded-lg border border-[var(--ad-border)] bg-[var(--ad-surface-2)] p-3 text-[11.5px] leading-5 text-[var(--ad-text-2)]">
              <p className="font-semibold text-[var(--ad-text)]">Ukuran gambar yang disarankan:</p>
              <ul className="mt-1.5 space-y-1">
                <li><strong>Hero Slider</strong> — 1920×1080 px (16:9) · 800×420 px minimum mobile</li>
                <li><strong>Promo Top / Bottom</strong> — 600×400 px (3:2) · 400×260 px minimum mobile</li>
              </ul>
              <p className="mt-1.5 text-[var(--ad-text-3)]">Gambar di-crop otomatis via object-cover, jadi aman upload lebih besar dari ukuran di atas.</p>
            </div>
            {uploadError && (
              <p className="text-[12px] font-semibold text-[var(--ad-red)]">{uploadError}</p>
            )}
            {imageUrl && (
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--ad-accent)] hover:underline"
              >
                <Eye size={12} /> Lihat gambar asli
              </a>
            )}
          </div>
        </div>

        {/* Hidden values so server action can read uploaded path/url */}
        <input type="hidden" name="image_url" value={imageUrl} />
        <input type="hidden" name="storage_path" value={storagePath} />
      </Section>

      <Section title="Konten Banner" icon={<Type size={14} />} open onToggle={() => {}} accent="#7c3aed">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama Banner" required>
            <input
              name="title"
              required
              defaultValue={initial?.title ?? ""}
              maxLength={200}
              className={inp}
            />
          </Field>
          <Field label="Subtitle">
            <input
              name="subtitle"
              defaultValue={initial?.subtitle ?? ""}
              maxLength={400}
              className={inp}
            />
          </Field>
          <Field label="Teks Tombol (CTA)">
            <input
              name="button_text"
              defaultValue={initial?.button_text ?? ""}
              maxLength={60}
              placeholder="Contoh: Lihat Koleksi"
              className={inp}
            />
          </Field>
          <Field label="Link Tujuan CTA">
            <input
              name="button_link"
              type="url"
              defaultValue={initial?.button_link ?? ""}
              maxLength={500}
              placeholder="https://…"
              className={inp}
            />
          </Field>
        </div>
      </Section>

      <Section title="Penempatan & Jadwal" icon={<CalendarClock size={14} />} open onToggle={() => {}} accent="#d97706">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Posisi" required>
            <select
              name="position"
              required
              defaultValue={initial?.position ?? "hero"}
              className={inp}
            >
              <option value="hero">Hero Slider</option>
              <option value="right_top">Promo Top (kanan atas)</option>
              <option value="right_bottom">Promo Bottom (kanan bawah)</option>
            </select>
          </Field>
          <Field label="Urutan Tampil">
            <input
              name="sort_order"
              type="number"
              min={0}
              max={9999}
              defaultValue={initial?.sort_order ?? 0}
              className={inp}
            />
          </Field>
          <Field label="Status Aktif">
            <label className="ad-inset flex items-center gap-2.5 px-3 py-2.5">
              <input
                name="status"
                type="checkbox"
                defaultChecked={initial?.status ?? true}
                className="ad-checkbox"
              />
              <span className="text-[13px] font-medium text-[var(--ad-text-2)]">
                Tampilkan di homepage
              </span>
            </label>
          </Field>
          <Field label="Fokus Gambar" hint="Ke mana gambar difokuskan saat crop">
            <select
              name="focus_point"
              defaultValue={initial?.focus_point ?? "center"}
              className={inp}
            >
              {FOCUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
          <div />
          <Field label="Tanggal Mulai" hint="Opsional">
            <input
              name="start_date"
              type="datetime-local"
              defaultValue={initialStartDate}
              className={`${inp} [color-scheme:light]`}
            />
          </Field>
          <Field label="Tanggal Selesai" hint="Opsional">
            <input
              name="end_date"
              type="datetime-local"
              defaultValue={initialEndDate}
              className={`${inp} [color-scheme:light]`}
            />
          </Field>
        </div>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-1 mt-2 flex items-center justify-end gap-2 border-t border-[var(--ad-border)] bg-white/95 p-3 backdrop-blur">
        <AdminButton variant="secondary" onClick={() => router.push("/admin/banners")}>
          Batal
        </AdminButton>
        <SubmitButton mode={mode} />
      </div>
      {pending && (
        <p className="text-center text-[12px] text-[var(--ad-text-3)]">Memproses…</p>
      )}
    </form>
  );
}
