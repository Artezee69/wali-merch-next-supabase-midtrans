"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Edit, Eye, EyeOff } from "lucide-react";
import { PopupAd } from "@/lib/adminPopupAds";

type Props = {
  initialData: PopupAd[];
};

export default function PopupAdsList({ initialData }: Props) {
  const [items, setItems] = useState<PopupAd[]>(initialData);

  const toggleStatus = async (ad: PopupAd) => {
    const updatedStatus = !ad.status;
    const res = await fetch(`/api/admin/popup-ads/toggle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ad.id, status: updatedStatus }),
    });
    if (!res.ok) return;
    setItems((prev) =>
      prev.map((item) => (item.id === ad.id ? { ...item, status: updatedStatus } : item))
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus popup ini?")) return;
    const res = await fetch(`/api/admin/popup-ads/delete?id=${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-3">
      {items.map((ad) => (
        <div
          key={ad.id}
          className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5"
        >
          {ad.image_url && (
            <img
              src={ad.image_url}
              alt={ad.title}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold truncate">{ad.title}</h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  ad.status
                    ? "bg-green-500/20 text-green-300"
                    : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {ad.status ? "Aktif" : "Nonaktif"}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  ad.position === "center"
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-purple-500/20 text-purple-300"
                }`}
              >
                {ad.position === "center" ? "Modal" : "Card"}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  ad.audience === "all"
                    ? "bg-yellow-500/20 text-yellow-300"
                    : ad.audience === "logged_in"
                    ? "bg-green-500/20 text-green-300"
                    : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {ad.audience === "all"
                  ? "Semua"
                  : ad.audience === "logged_in"
                  ? "Member"
                  : "Guest"}
              </span>
            </div>
            <p className="text-sm text-gray-400 truncate">{ad.body}</p>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/admin/popup-ads/${ad.id}/edit`}
              className="p-2 rounded hover:bg-white/10 transition-colors text-blue-400"
              aria-label="Edit popup"
            >
              <Edit size={16} />
            </Link>
            <button
              onClick={() => toggleStatus(ad)}
              className="p-2 rounded hover:bg-white/10 transition-colors text-green-400"
              aria-label={ad.status ? "Nonaktifkan" : "Aktifkan"}
            >
              {ad.status ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={() => handleDelete(ad.id)}
              className="p-2 rounded hover:bg-red-500/20 transition-colors text-red-400"
              aria-label="Hapus popup"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          Belum ada popup iklan. Klik "Tambah Popup Baru" untuk membuat.
        </p>
      )}
    </div>
  );
}
