import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/serverAuth";
import PopupAdsForm from "@/components/admin/PopupAdsForm";
import AdminShell from "@/components/admin/AdminShell";

export const metadata = {
  title: "Tambah Popup Baru — WALI Merch Admin",
};

export default async function NewPopupPage() {
  const user = await getCurrentUser();

  if (user?.role !== "admin") {
    redirect("/admin/login?reason=not_admin");
  }

  const adminName = user?.fullName ?? null;
  const adminEmail = user?.email ?? null;

  return (
    <AdminShell title="Tambah Popup" subtitle="Buat popup iklan baru" adminName={adminName} adminEmail={adminEmail}>
      <Link
        href="/admin/popup-ads"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#d7ff53] transition-colors mb-6"
      >
        ← Kembali ke Daftar Popup
      </Link>
      <PopupAdsForm initialPopup={{ title: "", body: "" }} mode="create" />
    </AdminShell>
  );
}
