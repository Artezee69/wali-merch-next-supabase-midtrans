"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Clock,
  Eye,
  EyeOff,
  MousePointer,
  Pencil,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { PopupAd } from "@/lib/adminPopupAds";
import { EmptyState, Pill, type PillTone } from "@/components/admin/ui";

type Props = {
  initialData: PopupAd[];
};

const StatusBadge = ({ active }: { active: boolean }) => (
  <Pill tone={active ? "green" : "neutral"}>
    {active ? (
      <>
        <Check className="h-3 w-3" /> Aktif
      </>
    ) : (
      <>
        <X className="h-3 w-3" /> Nonaktif
      </>
    )}
  </Pill>
);

const PositionBadge = ({ position }: { position: string }) => (
  <Pill tone={position === "center" ? "blue" : "accent"}>
    <MousePointer className="h-3 w-3" />
    {position === "center" ? "Modal" : "Card"}
  </Pill>
);

const AudienceBadge = ({ audience }: { audience: string }) => {
  const config: Record<string, { label: string; tone: PillTone }> = {
    all: { label: "Semua", tone: "amber" },
    logged_in: { label: "Member", tone: "green" },
    guest: { label: "Guest", tone: "neutral" },
  };
  const c = config[audience] ?? { label: audience, tone: "neutral" };
  return (
    <Pill tone={c.tone}>
      <Users className="h-3 w-3" />
      {c.label}
    </Pill>
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
      <div className="ad-card">
        <EmptyState
          icon={<MousePointer size={20} />}
          title="Belum ada popup iklan"
          description='Klik "Tambah Popup" untuk membuat yang pertama'
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {items.map((ad) => (
        <div
          key={ad.id}
          className={`ad-card group overflow-hidden !p-0 border-t-2 ${
            ad.status ? "border-t-green-500" : "border-t-amber-500"
          } transition hover:-translate-y-0.5 hover:shadow-lg`}
        >
          {/* Image */}
          <div className="relative h-36 overflow-hidden md:h-40">
            {ad.image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={ad.image_url}
                alt={ad.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[var(--ad-surface-2)]">
                <MousePointer size={28} className="text-[var(--ad-text-3)]" />
              </div>
            )}
            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
              <StatusBadge active={ad.status} />
              <PositionBadge position={ad.position} />
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="mb-1 line-clamp-1 text-[14px] font-bold text-[var(--ad-text)]">
              {ad.title}
            </h3>

            {ad.subtitle && (
              <p className="mb-1.5 line-clamp-1 text-[12px] font-medium text-[var(--ad-accent)]">
                {ad.subtitle}
              </p>
            )}

            <p className="mb-3 line-clamp-2 text-[12px] leading-5 text-[var(--ad-text-2)]">
              {ad.body}
            </p>

            {/* Meta info */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              <AudienceBadge audience={ad.audience} />
              {ad.dismiss_minutes && (
                <Pill tone="neutral">
                  <Clock className="h-3 w-3" />
                  {ad.dismiss_minutes}m
                </Pill>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between border-t border-[var(--ad-border-soft)] pt-3">
              <span className="text-[11.5px] text-[var(--ad-text-3)]">
                {ad.button_text || "Kunjungi"} → {ad.button_link || "/"}
              </span>

              <div className="flex items-center gap-0.5">
                <Link
                  href={`/admin/popup-ads/${ad.id}`}
                  className="ad-btn ad-btn-secondary ad-btn-icon ad-btn-sm !border-transparent"
                  aria-label="Edit popup"
                  title="Edit"
                >
                  <Pencil size={13} />
                </Link>
                <button
                  type="button"
                  onClick={() => toggleStatus(ad)}
                  className={`ad-btn ad-btn-icon ad-btn-sm !border-transparent ${
                    ad.status
                      ? "text-[var(--ad-amber)] hover:!bg-amber-50"
                      : "text-[var(--ad-green)] hover:!bg-green-50"
                  }`}
                  aria-label={ad.status ? "Nonaktifkan" : "Aktifkan"}
                  title={ad.status ? "Nonaktifkan" : "Aktifkan"}
                >
                  {ad.status ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(ad.id)}
                  className="ad-btn ad-btn-icon ad-btn-sm !border-transparent text-[var(--ad-red)] hover:!bg-red-50"
                  aria-label="Hapus popup"
                  title="Hapus"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
