import Link from "next/link";
import { redirect } from "next/navigation";
import { getAllPopupAds } from "@/lib/adminPopupAds";
import AdminShell from "@/components/admin/AdminShell";
import PopupAdsList from "@/components/admin/PopupAdsList";
import PopupAdsForm from "@/components/admin/PopupAdsForm";
import { getCurrentUser } from "@/lib/serverAuth";
import { Plus, LayoutGrid, PenTool } from "lucide-react";

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

  return (
    <AdminShell title="Popup Ads" subtitle="Kelola popup iklan yang muncul kepada pengguna" adminName={adminName} adminEmail={adminEmail}>
      <div className="space-y-8">
        {/* Header with Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Popup Ads</h1>
            <p className="text-sm text-gray-400 mt-1">
              {hasItems
                ? `${popupAds.length} popup aktif/nonaktif`
                : "Belum ada popup iklan"}
            </p>
          </div>
          <Link
            href="/admin/popup-ads/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#d7ff53] text-black font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-[#d7ff53]/20 hover:shadow-[#d7ff53]/30"
          >
            <Plus size={18} />
            <span>Tambah Popup Baru</span>
          </Link>
        </div>

        {/* Stats Cards */}
        {hasItems && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{popupAds.filter(p => p.status).length}</div>
              <div className="text-xs text-gray-400 mt-1">Aktif</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{popupAds.filter(p => !p.status).length}</div>
              <div className="text-xs text-gray-400 mt-1">Nonaktif</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{popupAds.filter(p => p.position === "center").length}</div>
              <div className="text-xs text-gray-400 mt-1">Modal</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{popupAds.filter(p => p.position === "bottom_right").length}</div>
              <div className="text-xs text-gray-400 mt-1">Card</div>
            </div>
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: List */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
              <LayoutGrid size={16} />
              <span>List Popup</span>
              <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs text-gray-300">
                {popupAds.length}
              </span>
            </div>
            <PopupAdsList initialData={popupAds} />
          </div>

          {/* Right: Edit Form */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
              <PenTool size={16} />
              <span>Edit Cepat</span>
            </div>
            {hasItems ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-4">Pilih popup di atas untuk mengedit</p>
                <PopupAdsForm initialPopup={popupAds[0]} mode="edit" />
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                  <Plus className="text-gray-500" size={24} />
                </div>
                <p className="text-gray-400 text-sm">Belum ada popup</p>
                <Link
                  href="/admin/popup-ads/new"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#d7ff53] text-black text-sm font-medium rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  <Plus size={14} />
                  Buat Popup Pertama
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
