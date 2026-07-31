"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";

export default function PopupAdsForm() {
  const { show } = useToast();
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { show("Upload gambar dulu"); return; }
    setLoading(true);

    try {
      // 1. Upload
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/admin/popup-ads/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error(uploadData.error);

      // 2. Simpan ke DB
      await fetch("/api/admin/popup-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: uploadData.url, link }),
      });

      show("Popup berhasil ditambahkan!");
      setLink("");
      setFile(null);
      setPreview("");
      setTimeout(() => window.location.reload(), 500);
    } catch {
      show("Gagal menyimpan popup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white/5 border border-white/10 rounded-xl p-6">
      <h2 className="text-lg font-bold">Tambah Popup Banner</h2>

      <div>
        <label className="block text-sm font-bold text-white/80 mb-2">Gambar *</label>
        <input type="file" accept="image/*" onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
        }} className="text-sm text-gray-400" />
        {preview && <img src={preview} className="mt-2 w-48 rounded-lg" />}
      </div>

      <div>
        <label className="block text-sm font-bold text-white/80 mb-2">Link Tujuan *</label>
        <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://wali-merch.com/products/..." className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-white focus:border-[#d7ff53] focus:outline-none" required />
      </div>

      <button type="submit" disabled={loading} className="w-full py-3 bg-[#d7ff53] text-black font-bold rounded-lg hover:opacity-90 disabled:opacity-50">
        {loading ? "Menyimpan..." : "Tambah Popup"}
      </button>
    </form>
  );
}
