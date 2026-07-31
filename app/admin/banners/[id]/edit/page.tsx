import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin, supabaseAdmin } from "@/lib/supabaseAdmin";
import AdminShell from "@/components/admin/AdminShell";
import BannerForm from "@/components/admin/BannerForm";

export const dynamic = "force-dynamic";

type BannerRow = {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string;
  storage_path: string;
  button_text: string | null;
  button_link: string | null;
  position: "hero" | "right_top" | "right_bottom";
  sort_order: number;
  status: boolean;
  start_date: string | null;
  end_date: string | null;
};

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  const supa = getSupabaseAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const { data: profile } = await supa
    .from("profiles")
    .select("full_name, email")
    .eq("id", session.userId)
    .maybeSingle();

  const { data: banner, error } = await supabaseAdmin
    .from("banners")
    .select(
      "id, title, subtitle, image_url, storage_path, button_text, button_link, position, sort_order, status, start_date, end_date"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <AdminShell
        title="Edit Banner"
        adminName={profile?.full_name ?? null}
        adminEmail={profile?.email ?? session.email}
      >
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm font-bold text-red-300">
          Gagal memuat banner: {error.message}
        </div>
      </AdminShell>
    );
  }
  if (!banner) notFound();

  const initial: BannerRow = banner as BannerRow;

  return (
    <AdminShell
      title="Edit Banner"
      subtitle={initial.title}
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

      <BannerForm mode="edit" initial={initial} />
    </AdminShell>
  );
}
