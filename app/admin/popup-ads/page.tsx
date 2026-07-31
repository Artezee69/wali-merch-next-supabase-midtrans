import Link from "next/link";
import { redirect } from "next/navigation";
import { getAllPopupAds, savePopupAds, deletePopupAds } from "@/lib/adminPopupAds";
import AdminShell from "@/components/admin/AdminShell";
import PopupAdsList from "@/components/admin/PopupAdsList";
import PopupAdsForm from "@/components/admin/PopupAdsForm";
import { getCurrentUser } from "@/lib/serverAuth";

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

  return (
    <AdminShell title="Popup Ads" subtitle="Kelola popup iklan yang muncul kepada pengguna" adminName={adminName} adminEmail={adminEmail}>
      <div className="space-y-6">
        {/* Add New Popup Button */}
        <div className="flex justify-end">
          <Link
            href="/admin/popup-ads/new"
            className="px-5 py-3 bg-[#d7ff53] text-black font-bold rounded-full hover:bg-opacity-90 transition-colors"
          >
            + Tambah Popup Baru
          </Link>
        </div>

        {/* List of Popup Ads */}
        <PopupAdsList initialData={popupAds} />

        {/* Detailed Form View (default first item) */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Edit Popup</h2>
          {popupAds && popupAds.length > 0 ? (
            <PopupAdsForm initialPopup={popupAds[0]} mode="edit" />
          ) : (
            <div className="text-center py-12 text-gray-500">
              Belum ada popup iklan. Klik "Tambah Popup Baru" di atas.
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}