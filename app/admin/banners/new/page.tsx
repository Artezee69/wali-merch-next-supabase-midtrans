import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import AdminShell from "@/components/admin/AdminShell";
import BannerForm from "@/components/admin/BannerForm";

export const dynamic = "force-dynamic";

export default async function NewBannerPage() {
  const session = await requireAdmin();
  const supa = getSupabaseAdmin();
  const { data: profile } = await supa
    .from("profiles")
    .select("full_name, email")
    .eq("id", session.userId)
    .maybeSingle();

  return (
    <AdminShell
      title="Tambah Banner"
      subtitle="Isi formulir di bawah untuk membuat banner baru"
      adminName={profile?.full_name ?? null}
      adminEmail={profile?.email ?? session.email}
    >
      <div className="mb-6">
        <Link
          href="/admin/banners"
          className="inline-flex items-center gap-1 text-xs font-bold text-white/55 hover:text-[#d7ff53]"
        >
          <ChevronLeft size={12} strokeWidth={2.5} />
          Kembali ke daftar banner
        </Link>
      </div>

      <BannerForm mode="create" />
    </AdminShell>
  );
}
