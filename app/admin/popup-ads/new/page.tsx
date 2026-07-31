import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/serverAuth";
import PopupAdsForm from "@/components/admin/PopupAdsForm";

export const metadata = { title: "Tambah Popup — WALI Merch Admin" };

export default async function NewPopupPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin/login?reason=not_admin");

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/popup-ads" className="text-sm text-gray-400 hover:text-[#d7ff53]">← Kembali</Link>
        <div className="mt-6">
          <PopupAdsForm />
        </div>
      </div>
    </div>
  );
}
