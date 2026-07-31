import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/serverAuth";
import { getAllPopupAds } from "@/lib/adminPopupAds";
import PopupAdsForm from "@/components/admin/PopupAdsForm";
import AdminShell from "@/components/admin/AdminShell";
import { notFound } from "next/navigation";

export const metadata = {
  title: `Edit Popup — WALI Merch Admin`,
};

export default async function EditPopupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (user?.role !== "admin") {
    redirect("/admin/login?reason=not_admin");
  }

  const popupId = parseInt(id, 10);
  if (isNaN(popupId)) {
    notFound();
  }

  const allPopupAds = await getAllPopupAds();
  const popup = allPopupAds.find((p) => p.id === popupId);

  if (!popup) {
    notFound();
  }

  const adminName = user?.fullName ?? null;
  const adminEmail = user?.email ?? null;

  return (
    <AdminShell title="Edit Popup" subtitle={`ID: #${popupId}`} adminName={adminName} adminEmail={adminEmail}>
      <Link
        href="/admin/popup-ads"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#d7ff53] transition-colors mb-6"
      >
        ← Kembali ke Daftar Popup
      </Link>
      <PopupAdsForm initialPopup={popup} mode="edit" />
    </AdminShell>
  );
}
