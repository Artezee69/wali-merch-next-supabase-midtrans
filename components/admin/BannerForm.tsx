"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  ImageIcon,
  Upload,
  X,
  Loader2,
  AlertTriangle,
  Eye,
} from "lucide-react";
import {
  createBanner,
  updateBanner,
  type BannerFormState,
} from "@/app/admin/banners/actions";

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
};

type Props = {
  mode: "create" | "edit";
  initial?: BannerInitial;
};

function toDateTimeLocal(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    // Convert to local datetime-local format
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-xl bg-[#d7ff53] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black transition hover:bg-[#c7ef33] disabled:opacity-60"
    >
      {pending && <Loader2 size={14} className="animate-spin" strokeWidth={2.5} />}
      {pending ? "Menyimpan..." : mode === "create" ? "Buat Banner" : "Simpan Perubahan"}
    </button>
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {(state && !state.ok) && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" strokeWidth={2.4} />
          <span>{state.error}</span>
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-sm font-black uppercase tracking-wider text-white/80">
          Gambar Banner
        </h2>
        <p className="mt-1 text-xs text-white/50">
          Format: PNG, JPG, WebP, SVG, atau GIF. Maksimal 5MB.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_300px]">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            {imageUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="block h-auto w-full max-h-[400px] object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-red-300 transition hover:border-red-500/60 hover:bg-red-500/20"
                >
                  <X size={12} strokeWidth={2.5} />
                  Hapus
                </button>
              </div>
            ) : (
              <div className="flex aspect-[16/9] flex-col items-center justify-center text-white/40">
                <ImageIcon size={32} strokeWidth={1.5} />
                <p className="mt-2 text-xs font-bold uppercase tracking-wider">
                  Belum ada gambar
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChosen}
              disabled={uploading}
              className="block w-full text-xs text-white/55 file:mr-3 file:rounded-full file:border-0 file:bg-white/[0.06] file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-wider file:text-white hover:file:bg-white/[0.12]"
            />
            <p className="text-[11px] text-white/45">
              Gambar lama di storage akan otomatis terhapus saat kamu upload
              gambar baru dan simpan.
            </p>
            {uploading && (
              <div className="inline-flex items-center gap-2 text-xs text-white/65">
                <Loader2 size={12} className="animate-spin" strokeWidth={2.5} />
                Mengupload...
              </div>
            )}
            {uploadError && (
              <p className="text-xs font-bold text-red-300">{uploadError}</p>
            )}
            {imageUrl && (
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 self-start text-[11px] font-bold text-[#d7ff53] hover:underline"
              >
                <Eye size={11} strokeWidth={2.5} />
                Lihat gambar asli
              </a>
            )}
          </div>
        </div>

        {/* Hidden values so server action can read uploaded path/url */}
        <input type="hidden" name="image_url" value={imageUrl} />
        <input type="hidden" name="storage_path" value={storagePath} />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-sm font-black uppercase tracking-wider text-white/80">
          Konten Banner
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nama Banner" required>
            <input
              name="title"
              required
              defaultValue={initial?.title ?? ""}
              maxLength={200}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-[#d7ff53]"
            />
          </Field>
          <Field label="Subtitle">
            <input
              name="subtitle"
              defaultValue={initial?.subtitle ?? ""}
              maxLength={400}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-[#d7ff53]"
            />
          </Field>
          <Field label="Teks Tombol (CTA)">
            <input
              name="button_text"
              defaultValue={initial?.button_text ?? ""}
              maxLength={60}
              placeholder="Contoh: Lihat Koleksi"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#d7ff53]"
            />
          </Field>
          <Field label="Link Tujuan CTA">
            <input
              name="button_link"
              type="url"
              defaultValue={initial?.button_link ?? ""}
              maxLength={500}
              placeholder="https://..."
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#d7ff53]"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-sm font-black uppercase tracking-wider text-white/80">
          Penempatan & Jadwal
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Posisi" required>
            <select
              name="position"
              required
              defaultValue={initial?.position ?? "hero"}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-[#d7ff53]"
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
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-[#d7ff53]"
            />
          </Field>
          <Field label="Status Aktif">
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5">
              <input
                name="status"
                type="checkbox"
                defaultChecked={initial?.status ?? true}
                className="h-4 w-4 accent-[#d7ff53]"
              />
              <span className="text-sm text-white/75">Tampilkan di homepage</span>
            </label>
          </Field>
          <div />
          <Field label="Tanggal Mulai (opsional)">
            <input
              name="start_date"
              type="datetime-local"
              defaultValue={initialStartDate}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-[#d7ff53]"
            />
          </Field>
          <Field label="Tanggal Selesai (opsional)">
            <input
              name="end_date"
              type="datetime-local"
              defaultValue={initialEndDate}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-[#d7ff53]"
            />
          </Field>
        </div>
      </section>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push("/admin/banners")}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white/70 transition hover:border-white/30 hover:text-white"
        >
          Batal
        </button>
        <SubmitButton mode={mode} />
      </div>
      {pending && (
        <p className="text-center text-xs text-white/45">Memproses...</p>
      )}
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-white/60">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>
      {children}
    </label>
  );
}
