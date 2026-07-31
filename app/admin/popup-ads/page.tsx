import Link from "next/link";
import { redirect } from "next/navigation";
import { getAllPopupAds } from "@/lib/adminPopupAds";
import AdminShell from "@/components/admin/AdminShell";
import PopupAdsList from "@/components/admin/PopupAdsList";
import PopupAdsForm from "@/components/admin/PopupAdsForm";
import { getCurrentUser } from "@/lib/serverAuth";

export const metadata = {
  title: "Popup Ads — WALI Merch Admin",
};

export default async function PopupAdsPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin/login?reason=not_admin");

  const popupAds = await getAllPopupAds();
  const adminName = user?.fullName ?? null;
  const adminEmail = user?.email ?? null;

  return (
    <AdminShell title="Popup Ads" subtitle="Upload banner, atur link tujuan" adminName={adminName} adminEmail={adminEmail}>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Link href="/admin/popup-ads/new" className="px-5 py-3 bg-[#d7ff53] text-black font-bold rounded-full hover:opacity-90">
            + Tambah Popup Baru
          </Link>
        </div>
        <PopupAdsList initialData={popupAds} />
      </div>
    </AdminShell>
  );
}
