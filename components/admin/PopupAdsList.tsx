"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { PopupAd } from "@/lib/adminPopupAds";
import { deletePopupAds } from "@/lib/adminPopupAds";

type Props = {
  initialData: PopupAd[];
};

export default function PopupAdsList({ initialData }: Props) {
  const [items, setItems] = useState<PopupAd[]>(initialData);
  const { show } = useToast();

  const toggleStatus = async (ad: PopupAd) => {
    const newStatus = !ad.status;
    const res = await fetch("/api/admin/popup-ads/toggle", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ad.id, status: newStatus }),
    });
    if (!res.ok) return;
    setItems((prev) => prev.map((i) => i.id === ad.id ? { ...i, status: newStatus } : i));
    show(newStatus ? "Popup diaktifkan" : "Popup dinonaktifkan");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus popup ini?")) return;
    await fetch(`/api/admin/popup-ads/delete?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    show("Popup dihapus");
  };

  return (
    <div className="space-y-3">
      {items.map((ad) => (
        <div key={ad.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
          <img src={ad.image_url} alt="popup" className="w-24 h-16 object-cover rounded-lg" />
          <div className="flex-1">
            <a href={ad.link} target="_blank" className="text-blue-400 hover:underline text-sm block truncate">
              {ad.link}
            </a>
            <span className={`text-xs px-2 py-0.5 rounded-full ${ad.status ? "bg-green-500/20 text-green-300" : "bg-gray-500/20 text-gray-400"}`}>
              {ad.status ? "Aktif" : "Nonaktif"}
            </span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => toggleStatus(ad)} className="p-2 rounded hover:bg-white/10 text-green-400">
              {ad.status ? "👁" : "👁‍🗨"}
            </button>
            <button onClick={() => handleDelete(ad.id)} className="p-2 rounded hover:bg-red-500/20 text-red-400">
              🗑
            </button>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-gray-500 text-center py-8">Belum ada popup. Tambah gambar banner.</p>
      )}
    </div>
  );
}
