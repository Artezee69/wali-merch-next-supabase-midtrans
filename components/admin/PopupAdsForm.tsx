"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { PopupAd } from "@/lib/adminPopupAds";
import {
  Info,
  Image as ImageIcon,
  Loader2,
  MousePointer,
  Plus,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import {
  AdminButton,
  AdminCard,
  Alert,
  Field,
  Section,
  Toggle,
} from "@/components/admin/ui";

type Props = {
  initialPopup?: Partial<PopupAd>;
  mode: "edit" | "create";
};

const inp = "ad-input";

export default function PopupAdsForm({ initialPopup, mode }: Props) {
  const { show } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Partial<PopupAd>>({});

  // Initialize form data from initialPopup if editing
  useEffect(() => {
    if (mode === "edit" && initialPopup) {
      const imagePath = initialPopup.image_url || "";
      setData({
        title: initialPopup.title,
        subtitle: initialPopup.subtitle,
        body: initialPopup.body,
        image_url: imagePath,
        storage_path: initialPopup.storage_path || (imagePath.startsWith("/") ? imagePath.slice(1) : imagePath),
        button_text: initialPopup.button_text,
        button_link: initialPopup.button_link,
        position: initialPopup.position,
        status: initialPopup.status,
        start_date: initialPopup.start_date,
        end_date: initialPopup.end_date,
        dismiss_minutes: initialPopup.dismiss_minutes,
        audience: initialPopup.audience,
        sort_order: initialPopup.sort_order,
      });
    }
  }, [mode, initialPopup]);

  const handleChange = (field: string, value: unknown) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const imagePath = data.image_url || "";
      const payload = {
        title: data.title || "",
        subtitle: data.subtitle || null,
        body: data.body || "",
        image_url: imagePath,
        storage_path: data.storage_path || (imagePath.startsWith("/") ? imagePath.slice(1) : imagePath),
        button_text: data.button_text || "Kunjungi",
        button_link: data.button_link || "/",
        position: data.position || "center",
        status: data.status !== false,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        dismiss_minutes: data.dismiss_minutes || 60,
        audience: data.audience || "logged_in",
        sort_order: data.sort_order || 0,
      };

      const isEdit = mode === "edit" && initialPopup?.id != null;
      const res = await fetch("/api/admin/popup-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: initialPopup.id, ...payload } : payload),
      });
      if (!res.ok) throw new Error("Failed to save popup");
      show(isEdit ? "Popup iklan berhasil disimpan!" : "Popup iklan baru berhasil ditambahkan!");

      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error("ERROR SIMPAN POPUP:", err);
      show("Gagal menyimpan popup iklan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      {/* Breadcrumb */}
      <nav className="text-[12px] text-[var(--ad-text-3)]" aria-label="Breadcrumb">
        <Link href="/admin" className="hover:text-[var(--ad-accent)]">
          Admin
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/admin/popup-ads" className="hover:text-[var(--ad-accent)]">
          Popup Ads
        </Link>
        <span className="mx-1.5">/</span>
        <span className="font-medium text-[var(--ad-text)]">{mode}</span>
      </nav>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <Section title="Informasi Dasar" icon={<Info size={14} />} open onToggle={() => {}} accent="#2563eb">
          <div className="grid gap-4">
            <Field label="Judul" required>
              <input
                type="text"
                value={data.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
                className={inp}
                placeholder="Contoh: Promo Flash Sale!"
                required
              />
            </Field>

            <Field label="Subjudul" hint="Opsional">
              <input
                type="text"
                value={data.subtitle || ""}
                onChange={(e) => handleChange("subtitle", e.target.value)}
                className={inp}
                placeholder="Contoh: Dapatkan diskon 50% hari ini!"
              />
            </Field>

            <Field label="Isi/Pesan" required>
              <textarea
                value={data.body || ""}
                onChange={(e) => handleChange("body", e.target.value)}
                rows={4}
                className={`${inp} resize-none`}
                placeholder="Teks yang akan ditampilkan ke pengguna…"
                required
              />
            </Field>
          </div>
        </Section>

        {/* Image */}
        <Section title="Gambar" icon={<ImageIcon size={14} />} open onToggle={() => {}} accent="#7c3aed">
          <div className="grid gap-4">
            <Field label="Path Gambar" required>
              <input
                type="text"
                value={data.image_url || ""}
                onChange={(e) => handleChange("image_url", e.target.value)}
                className={`${inp} font-mono text-[12px]`}
                placeholder="/popup/banner-1.jpg"
                required
              />
              <p className="mt-1.5 text-[11px] text-[var(--ad-text-3)]">
                Letakkan gambar di folder{" "}
                <code className="rounded bg-[var(--ad-surface-2)] px-1.5 py-0.5 text-[var(--ad-accent)]">
                  public/popup/
                </code>
              </p>
            </Field>

            <Field label="Path Penyimpanan" hint="Opsional">
              <input
                type="text"
                value={data.storage_path || ""}
                onChange={(e) => handleChange("storage_path", e.target.value)}
                className={`${inp} font-mono text-[12px]`}
                placeholder="popup/banner-1.jpg"
              />
            </Field>

            {data.image_url && (
              <div className="rounded-xl border border-[var(--ad-border)] overflow-hidden bg-[var(--ad-surface-2)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.image_url} alt="Preview" className="w-full h-40 object-cover" />
              </div>
            )}
          </div>
        </Section>

        {/* CTA & Position */}
        <Section title="Tombol CTA & Posisi" icon={<MousePointer size={14} />} open onToggle={() => {}} accent="#d97706">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Teks Tombol">
              <input
                type="text"
                value={data.button_text || ""}
                onChange={(e) => handleChange("button_text", e.target.value)}
                className={inp}
                placeholder="Contoh: Beli Sekarang"
              />
            </Field>

            <Field label="Link Target">
              <input
                type="text"
                value={data.button_link || ""}
                onChange={(e) => handleChange("button_link", e.target.value)}
                className={inp}
                placeholder="/produk/sale"
              />
            </Field>

            <Field label="Posisi Popup">
              <select
                value={data.position || "center"}
                onChange={(e) => handleChange("position", e.target.value)}
                className={inp}
              >
                <option value="center">Tengah Layar (Modal Overlay)</option>
                <option value="bottom_right">Pojok Bawah Kanan</option>
              </select>
            </Field>

            <Field label="Target Audiens">
              <select
                value={data.audience || "logged_in"}
                onChange={(e) => handleChange("audience", e.target.value)}
                className={inp}
              >
                <option value="logged_in">Hanya Pengguna Login</option>
                <option value="all">Semua Pengunjung</option>
                <option value="guest">Tamu / Hanya Pengunjung</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* Settings */}
        <Section title="Pengaturan" icon={<SlidersHorizontal size={14} />} open onToggle={() => {}} accent="#16a34a">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Durasi (menit)" hint="Hide setelah menutup">
              <input
                type="number"
                value={data.dismiss_minutes || 60}
                onChange={(e) => handleChange("dismiss_minutes", Number(e.target.value))}
                className={inp}
                min="1"
                max="1440"
              />
            </Field>

            <div>
              <Field label="Status">
                <Toggle
                  value={data.status !== false}
                  onChange={(v) => handleChange("status", v)}
                />
              </Field>
            </div>

            <Field label="Urutan Tampil" hint="Kecil = lebih dulu tampil">
              <input
                type="number"
                value={data.sort_order || 0}
                onChange={(e) => handleChange("sort_order", Number(e.target.value))}
                className={inp}
                min="0"
              />
            </Field>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Mulai Tanggal" hint="Opsional">
              <input
                type="datetime-local"
                value={data.start_date ? data.start_date.slice(0, 16) || "" : ""}
                onChange={(e) => handleChange("start_date", e.target.value + "Z")}
                className={`${inp} [color-scheme:light]`}
              />
            </Field>

            <Field label="Selesai Tanggal" hint="Opsional">
              <input
                type="datetime-local"
                value={data.end_date ? data.end_date.slice(0, 16) || "" : ""}
                onChange={(e) => handleChange("end_date", e.target.value + "Z")}
                className={`${inp} [color-scheme:light]`}
              />
            </Field>
          </div>
        </Section>

        {/* Actions */}
        <div className="sticky bottom-0 z-10 mt-5 flex flex-col gap-2.5 border-t bg-white/95 p-4 backdrop-blur sm:flex-row">
          <AdminButton type="submit" disabled={loading} className="flex-1 !py-3">
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : mode === "create" ? (
              <Plus size={15} />
            ) : (
              <Save size={15} />
            )}
            {loading
              ? "Menyimpan…"
              : mode === "create"
                ? "Buat Popup"
                : "Simpan Perubahan"}
          </AdminButton>
        </div>
      </form>
    </div>
  );
}
