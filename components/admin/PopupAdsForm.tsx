"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { PopupAd } from "@/lib/adminPopupAds";

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
        status: data.status !== false, // default true
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

      // Refresh page to see changes
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error("ERROR SIMPAN POPUP:", err);
      show("Gagal menyimpan popup iklan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white/5 border border-white/10 rounded-xl p-6">
      <h2 className="text-lg font-bold mb-4">{mode === "create" ? "Tambah Popup Baru" : "Edit Popup"}</h2>

      <div>
        <label className="block text-sm font-bold text-white/80 mb-2">Judul *</label>
        <input
          type="text"
          value={data.title || ""}
          onChange={(e) => handleChange("title", e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-white focus:border-[#d7ff53] focus:outline-none"
          placeholder="Contoh: Promo Flash Sale!"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-white/80 mb-2">Subjudul (opsional)</label>
        <input
          type="text"
          value={data.subtitle || ""}
          onChange={(e) => handleChange("subtitle", e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-white focus:border-[#d7ff53] focus:outline-none"
          placeholder="Contoh: Dapatkan diskon 50% hari ini!"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-white/80 mb-2">Isi/Pesan *</label>
        <textarea
          value={data.body || ""}
          onChange={(e) => handleChange("body", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-white focus:border-[#d7ff53] focus:outline-none resize-none"
          placeholder="Teks yang akan ditampilkan ke pengguna..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-white/80 mb-2">Gambar</label>
        <input
          type="text"
          value={data.image_url || ""}
          onChange={(e) => handleChange("image_url", e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-white focus:border-[#d7ff53] focus:outline-none"
          placeholder="URL gambar (dari supabase storage)"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-white/80 mb-2">Path Penyimpanan (Opsional)</label>
        <input
          type="text"
          value={data.storage_path || ""}
          onChange={(e) => handleChange("storage_path", e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-white focus:border-[#d7ff53] focus:outline-none"
          placeholder="/popup/ads/2024/promo.jpg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-white/80 mb-2">Tombak CTA</label>
          <input
            type="text"
            value={data.button_text || ""}
            onChange={(e) => handleChange("button_text", e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-white focus:border-[#d7ff53] focus:outline-none"
            placeholder="Contoh: Beli Sekarang"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-white/80 mb-2">Link Target</label>
          <input
            type="text"
            value={data.button_link || ""}
            onChange={(e) => handleChange("button_link", e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-white focus:border-[#d7ff53] focus:outline-none"
            placeholder="/produk/sale"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-white/80 mb-2">Posisi Popup</label>
          <select
            value={data.position || "center"}
            onChange={(e) => handleChange("position", e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-white focus:border-[#d7ff53] focus:outline-none"
          >
            <option value="center">Tengah Layar (Modal Overlay)</option>
            <option value="bottom_right">Pojok Bawah Kanan</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-white/80 mb-2">Target Audiens</label>
          <select
            value={data.audience || "logged_in"}
            onChange={(e) => handleChange("audience", e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-white focus:border-[#d7ff53] focus:outline-none"
          >
            <option value="logged_in">Hanya Pengguna Login</option>
            <option value="all">Semua Pengunjung</option>
            <option value="guest">Tamunan/Hanya Pengunjung</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-bold text-white/80 mb-2">Durasi Tampil (menit setelah menutup)</label>
          <input
            type="number"
            value={data.dismiss_minutes || 60}
            onChange={(e) => handleChange("dismiss_minutes", Number(e.target.value))}
            className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-white focus:border-[#d7ff53] focus:outline-none"
            min="1"
            max="1440"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-white/80 mb-2">Status Aktif</label>
          <select
            value={data.status !== false ? "on" : "off"}
            onChange={(e) => handleChange("status", e.target.value === "on")}
            className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-white focus:border-[#d7ff53] focus:outline-none"
          >
            <option value="on">Aktif</option>
            <option value="off">Nonaktif</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-white/80 mb-2">Urutan Tampil</label>
          <input
            type="number"
            value={data.sort_order || 0}
            onChange={(e) => handleChange("sort_order", Number(e.target.value))}
            className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-white focus:border-[#d7ff53] focus:outline-none"
            min="0"
          />
        </div>
      </div>

      {/* Date range picker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-white/80 mb-2">Mulai Tanggal (opsional)</label>
          <input
            type="datetime-local"
            value={data.start_date ? data.start_date.slice(0, 16) || "" : ""}
            onChange={(e) => handleChange("start_date", e.target.value + "Z")}
            className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-white focus:border-[#d7ff53] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-white/80 mb-2">Selesai Tanggal (opsional)</label>
          <input
            type="datetime-local"
            value={data.end_date ? data.end_date.slice(0, 16) || "" : ""}
            onChange={(e) => handleChange("end_date", e.target.value + "Z")}
            className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-white focus:border-[#d7ff53] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 px-6 bg-[#d7ff53] text-black font-bold rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Menyimpan..." : mode === "create" ? "Buat Popup" : "Simpan Perubahan"}
        </button>
        {mode === "create" && (
          <Link
            href="/admin/popup-ads"
            className="py-3 px-6 border border-white/20 bg-black/40 text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            Batal
          </Link>
        )}
      </div>
    </form>
  );
}