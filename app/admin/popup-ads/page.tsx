import Link from "next/link";
import { redirect } from "next/navigation";
import { getAllPopupAds } from "@/lib/adminPopupAds";
import AdminShell from "@/components/admin/AdminShell";
import PopupAdsList from "@/components/admin/PopupAdsList";
import PopupAdsForm from "@/components/admin/PopupAdsForm";
import { getCurrentUser } from "@/lib/serverAuth";
import { AdminCard, AdminLink, Pill } from "@/components/admin/ui";
import { LayoutGrid, PenTool, Plus, MousePointer, ToggleRight, Circle, Box } from "lucide-react";

export const metadata = {
  title: "Popup Ads — WALI Merch Admin",
};

export default async function PopupAdsPage() {
  const user = await getCurrentUser();

  if (user?.role !== "admin") {
    redirect("/admin/login?reason=not_admin");
  }

  const popupAds = await getAllPopupAds();

  const adminName = user?.fullName ?? null;
  const adminEmail = user?.email ?? null;

  const hasItems = popupAds.length > 0;

  const stats = [
    { icon: ToggleRight, label: "Aktif", value: popupAds.filter((p) => p.status).length, accent: "#16a34a" },
    { icon: Circle, label: "Nonaktif", value: popupAds.filter((p) => !p.status).length, accent: "#d97706" },
    { icon: Box, label: "Modal", value: popupAds.filter((p) => p.position === "center").length, accent: "#2563eb" },
    { icon: MousePointer, label: "Card", value: popupAds.filter((p) => p.position === "bottom_right").length, accent: "#7c3aed" },
  ];

  return (
    <AdminShell
      title="Popup Ads"
      subtitle="Kelola popup iklan yang muncul kepada pengguna"
      adminName={adminName}
      adminEmail={adminEmail}
    >
      <div className="space-y-5">
        {/* Header with Action Button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--ad-text)]">
              Popup Ads
            </h1>
            <p className="mt-0.5 text-[13px] text-[var(--ad-text-3)]">
              {hasItems
                ? `${popupAds.length} popup aktif/nonaktif`
                : "Belum ada popup iklan"}
            </p>
          </div>
          <AdminLink href="/admin/popup-ads/new">
            <Plus size={14} /> Tambah Popup Baru
          </AdminLink>
        </div>

        {/* Stats Cards */}
        {hasItems && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <AdminCard key={s.label} className="!p-3.5" style={{ borderLeft: `4px solid ${s.accent}` }}>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--ad-accent-soft)] text-[var(--ad-accent)]">
                      <Icon size={15} />
                    </div>
                    <div>
                      <p className="text-[19px] font-bold leading-none text-[var(--ad-text)]">
                        {s.value}
                      </p>
                      <p className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--ad-text-3)]">
                        {s.label}
                      </p>
                    </div>
                  </div>
                </AdminCard>
              );
            })}
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: List */}
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ad-text-3)]">
                Admin / Popup Ads
              </p>
              <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--ad-accent-soft)] text-[var(--ad-accent)]">
                <LayoutGrid size={13} />
              </span>
                <span className="text-[13px] font-semibold text-[var(--ad-text-2)]">
                  List Popup
                </span>
                <Pill tone="neutral">{popupAds.length}</Pill>
              </div>
            </div>
            <PopupAdsList initialData={popupAds} />
          </div>

          {/* Right: Edit Form */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--ad-accent-soft)] text-[var(--ad-accent)]">
                <PenTool size={13} />
              </span>
              <span className="text-[13px] font-semibold text-[var(--ad-text-2)]">
                Edit Cepat
              </span>
            </div>
            {hasItems ? (
              <AdminCard>
                <p className="mb-4 text-[11.5px] text-[var(--ad-text-3)]">
                  Pilih popup di atas untuk mengedit
                </p>
                <PopupAdsForm initialPopup={popupAds[0]} mode="edit" />
              </AdminCard>
            ) : (
              <AdminCard className="!p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ad-surface-2)] text-[var(--ad-text-3)]">
                  <Plus size={22} />
                </div>
                <p className="text-[13px] font-semibold text-[var(--ad-text-2)]">
                  Belum ada popup
                </p>
                <AdminLink href="/admin/popup-ads/new" className="mx-auto mt-4">
                  <Plus size={13} /> Buat Popup Pertama
                </AdminLink>
              </AdminCard>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
