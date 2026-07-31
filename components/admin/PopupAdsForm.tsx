"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { PopupAd } from "@/lib/adminPopupAds";
import { ArrowLeft, Image as ImageIcon, Plus, Save, Eye } from "lucide-react";

type Props = {
  initialPopup?: Partial<PopupAd>;
  mode: "edit" | "create";
};

export default function PopupAdsForm({ initialPopup, mode }: Props) {
  const { show } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Partial<PopupAd>>({});

  // Initialize form data from initialPopup if editing
  useEffect(() => {
    if (mode === "edit" && initialPopup) {
      setData({
        title: initialPopup.title,
        subtitle: initialPopup.subtitle,
        body: initialPopup.body,
        image_url: initialPopup.image_url,
        storage_path: initialPopup.storage_path,
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

  const handleChange = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title: data.title || "",
        body: data.body || "",
        image_url: data.image_url || "",
        storage_path: data.storage_path || "",
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

  const inputClass = "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white text-sm focus:border-[#d7ff53] focus:outline-none focus:ring-1 focus:ring-[#d7ff53]/50 transition-all placeholder:text-gray-500";
  const labelClass = "block text-sm font-medium text-gray-300 mb-2";
  const sectionClass = "space-y-4";
  const cardClass = "bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5";

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {mode === "create" && (
            <Link
              href="/admin/popup-ads"
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              aria-label="Kembali"
            >
              <ArrowLeft size={18} />
            </Link>
          )}
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {mode === "create" ? (
              <><Plus className="text-[#d7ff53]" size={20} /> Tambah Popup Baru</>
            ) : (
              <><Save className="text-[#d7ff53]" size={20} /> Edit Popup</>
            )}
          </h2>
        </div>

        {mode === "edit" && data.image_url && (
          <Link
            href={data.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs text-gray-400"
          >
            <Eye size={14} />
            <span className="hidden sm:inline">Pratinjau Gambar</span>
          </Link>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-[#d7ff53] uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#d7ff53] rounded-full" />
            Informasi Dasar
          </h3>
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Judul <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={data.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
                className={inputClass}
                placeholder="Contoh: Promo Flash Sale!"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Subjudul (opsional)</label>
              <input
                type="text"
                value={data.subtitle || ""}
                onChange={(e) => handleChange("subtitle", e.target.value)}
                className={inputClass}
                placeholder="Contoh: Dapatkan diskon 50% hari ini!"
              />
            </div>

            <div>
              <label className={labelClass}>Isi/Pesan <span className="text-red-400">*</span></label>
              <textarea
                value={data.body || ""}
                onChange={(e) => handleChange("body", e.target.value)}
                rows={4}
                className={`${inputClass} resize-none`}
                placeholder="Teks yang akan ditampilkan ke pengguna..."
                required
              />
            </div>
          </div>
        </div>

        {/* Image */}
        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-[#d7ff53] uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#d7ff53] rounded-full" />
            Gambar
          </h3>
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Path Gambar <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={data.image_url || ""}
                onChange={(e) => handleChange("image_url", e.target.value)}
                className={inputClass}
                placeholder="/popup/banner-1.jpg"
                required
              />
              <p className="text-xs text-gray-500 mt-1.5">Letakkan gambar di folder <code className="bg-white/10 px-1.5 py-0.5 rounded text-[#d7ff53]/80">public/popup/</code></p>
            </div>

            <div>
              <label className={labelClass}>Path Penyimpanan (opsional)</label>
              <input
                type="text"
                value={data.storage_path || ""}
                onChange={(e) => handleChange("storage_path", e.target.value)}
                className={inputClass}
                placeholder="popup/banner-1.jpg"
              />
            </div>

            {data.image_url && (
              <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
                <img src={data.image_url} alt="Preview" className="w-full h-40 object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* CTA & Position */}
        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-[#d7ff53] uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#d7ff53] rounded-full" />
            Tombol CTA & Posisi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Teks Tombol</label>
              <input
                type="text"
                value={data.button_text || ""}
                onChange={(e) => handleChange("button_text", e.target.value)}
                className={inputClass}
                placeholder="Contoh: Beli Sekarang"
              />
            </div>

            <div>
              <label className={labelClass}>Link Target</label>
              <input
                type="text"
                value={data.button_link || ""}
                onChange={(e) => handleChange("button_link", e.target.value)}
                className={inputClass}
                placeholder="/produk/sale"
              />
            </div>

            <div>
              <label className={labelClass}>Posisi Popup</label>
              <select
                value={data.position || "center"}
                onChange={(e) => handleChange("position", e.target.value)}
                className={inputClass}
              >
                <option value="center">Tengah Layar (Modal Overlay)</option>
                <option value="bottom_right">Pojok Bawah Kanan</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Target Audiens</label>
              <select
                value={data.audience || "logged_in"}
                onChange={(e) => handleChange("audience", e.target.value)}
                className={inputClass}
              >
                <option value="logged_in">Hanya Pengguna Login</option>
                <option value="all">Semua Pengunjung</option>
                <option value="guest">Tamuan/Hanya Pengunjung</option>
              </select>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-[#d7ff53] uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#d7ff53] rounded-full" />
            Pengaturan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Durasi (menit)</label>
              <input
                type="number"
                value={data.dismiss_minutes || 60}
                onChange={(e) => handleChange("dismiss_minutes", Number(e.target.value))}
                className={inputClass}
                min="1"
                max="1440"
              />
              <p className="text-xs text-gray-500 mt-1.5">Hide setelah menutup</p>
            </div>

            <div>
              <label className={labelClass}>Status</label>
              <select
                value={data.status !== false ? "on" : "off"}
                onChange={(e) => handleChange("status", e.target.value === "on")}
                className={inputClass}
              >
                <option value="on">✓ Aktif</option>
                <option value="off">✗ Nonaktif</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Urutan Tampil</label>
              <input
                type="number"
                value={data.sort_order || 0}
                onChange={(e) => handleChange("sort_order", Number(e.target.value))}
                className={inputClass}
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1.5">Smaller = lebih dulu tampil</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className={labelClass}>Mulai Tanggal (opsional)</label>
              <input
                type="datetime-local"
                value={data.start_date ? data.start_date.slice(0, 16) || "" : ""}
                onChange={(e) => handleChange("start_date", e.target.value + "Z")}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Selesai Tanggal (opsional)</label>
              <input
                type="datetime-local"
                value={data.end_date ? data.end_date.slice(0, 16) || "" : ""}
                onChange={(e) => handleChange("end_date", e.target.value + "Z")}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-[#d7ff53] text-black font-bold rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Menyimpan...</>
            ) : mode === "create" ? (
              <><Plus size={18} /> Buat Popup</>
            ) : (
              <><Save size={18} /> Simpan Perubahan</>
            )}
          </button>
          {mode === "create" && (
            <Link
              href="/admin/popup-ads"
              className="flex items-center justify-center py-3.5 px-6 border border-white/10 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              Batal
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
