"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Edit, Eye, EyeOff, Calendar, Users, MousePointer, Check, X } from "lucide-react";
import { PopupAd } from "@/lib/adminPopupAds";

type Props = {
  initialData: PopupAd[];
};

const Badge = ({ children, className }: { children: React.ReactNode; className: string }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const StatusBadge = ({ active }: { active: boolean }) => (
  <Badge className={active ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-gray-500/20 text-gray-400 border border-gray-500/30"}>
    {active ? (
      <><Check className="w-3 h-3 mr-1" /> Aktif</>
    ) : (
      <><X className="w-3 h-3 mr-1" /> Nonaktif</>
    )}
  </Badge>
);

const PositionBadge = ({ position }: { position: string }) => (
  <Badge className={position === "center" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-violet-500/20 text-violet-300 border border-violet-500/30"}>
    <MousePointer className="w-3 h-3 mr-1" />
    {position === "center" ? "Modal" : "Card"}
  </Badge>
);

const AudienceBadge = ({ audience }: { audience: string }) => {
  const config = {
    all: { label: "Semua", class: "bg-amber-500/20 text-amber-300 border border-amber-500/30" },
    logged_in: { label: "Member", class: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" },
    guest: { label: "Guest", class: "bg-gray-500/20 text-gray-400 border border-gray-500/30" },
  }[audience] || { label: audience, class: "bg-gray-500/20 text-gray-400" };

  return (
    <Badge className={config.class}>
      <Users className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
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

  if (items.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl border border-white/10 bg-white/5">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
          <MousePointer className="w-8 h-8 text-gray-500" />
        </div>
        <p className="text-gray-400 text-sm">Belum ada popup iklan</p>
        <p className="text-gray-600 text-xs mt-1">Klik "Tambah Popup" untuk membuat yang pertama</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((ad) => (
        <div
          key={ad.id}
          className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-black/20"
        >
          {/* Image */}
          <div className="relative h-32 md:h-40 overflow-hidden">
            {ad.image_url ? (
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                <span className="text-4xl">🎯</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Position indicator */}
            <div className="absolute top-3 right-3">
              <PositionBadge position={ad.position} />
            </div>

            {/* Status indicator */}
            <div className="absolute top-3 left-3">
              <StatusBadge active={ad.status} />
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-bold text-white text-sm mb-2 line-clamp-1">{ad.title}</h3>

            {ad.subtitle && (
              <p className="text-xs text-[#d7ff53]/80 font-medium mb-2 line-clamp-1">{ad.subtitle}</p>
            )}

            <p className="text-gray-400 text-xs line-clamp-2 mb-3">{ad.body}</p>

            {/* Meta info */}
            <div className="flex flex-wrap gap-2 mb-3">
              <AudienceBadge audience={ad.audience} />
              {ad.dismiss_minutes && (
                <Badge className="bg-white/5 text-gray-400 border border-white/10">
                  {ad.dismiss_minutes}m
                </Badge>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-xs text-gray-500">
                {ad.button_text || "Kunjungi"} → {ad.button_link || "/"}
              </span>

              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/popup-ads/${ad.id}/edit`}
                  className="p-2 rounded-lg hover:bg-blue-500/20 transition-colors text-blue-400 hover:text-blue-300"
                  aria-label="Edit popup"
                  title="Edit"
                >
                  <Edit size={14} />
                </Link>
                <button
                  onClick={() => toggleStatus(ad)}
                  className={`p-2 rounded-lg transition-colors ${
                    ad.status
                      ? "hover:bg-amber-500/20 text-amber-400"
                      : "hover:bg-emerald-500/20 text-emerald-400"
                  }`}
                  aria-label={ad.status ? "Nonaktifkan" : "Aktifkan"}
                  title={ad.status ? "Nonaktifkan" : "Aktifkan"}
                >
                  {ad.status ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={() => handleDelete(ad.id)}
                  className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-red-400 hover:text-red-300"
                  aria-label="Hapus popup"
                  title="Hapus"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
