import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/serverAuth";
import PopupAdsForm from "@/components/admin/PopupAdsForm";

export const metadata = {
  title: "Tambah Popup Baru — WALI Merch Admin",
};

export default async function NewPopupPage() {
  const user = await getCurrentUser();

  if (user?.role !== "admin") {
    redirect("/admin/login?reason=not_admin");
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/popup-ads" className="text-sm text-gray-400 hover:text-[#d7ff53] transition-colors">
            ← Kembali ke Daftar Popup
          </Link>
        </div>
        <PopupAdsForm initialPopup={{ title: "", body: "" }} mode="create" />
      </div>
    </div>
  );
}