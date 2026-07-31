import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/serverAuth";
import { getAllPopupAds } from "@/lib/adminPopupAds";
import PopupAdsForm from "@/components/admin/PopupAdsForm";
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

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/popup-ads" className="text-sm text-gray-400 hover:text-[#d7ff53] transition-colors">
            ← Kembali ke Daftar Popup
          </Link>
        </div>
        <PopupAdsForm initialPopup={popup} mode="edit" />
      </div>
    </div>
  );
}