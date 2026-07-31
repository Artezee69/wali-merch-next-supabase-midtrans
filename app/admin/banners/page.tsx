import Link from "next/link";
import { ImageIcon, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import AdminShell from "@/components/admin/AdminShell";
import BannersListClient from "@/components/admin/BannersListClient";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const POSITIONS = ["hero", "right_top", "right_bottom"] as const;
type BannerPosition = (typeof POSITIONS)[number];

const PAGE_SIZE = 12;

type BannerRow = {
  id: number;
  title: string;
  image_url: string;
  position: BannerPosition;
  status: boolean;
  sort_order: number;
  button_text: string | null;
  button_link: string | null;
  created_at: string;
};

export default async function AdminBannersPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    position?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const session = await requireAdmin();
  const supa = getSupabaseAdmin();
  const params = (await searchParams) ?? {};
  const q = (params.q ?? "").trim();
  const position =
    typeof params.position === "string" && (POSITIONS as readonly string[]).includes(params.position)
      ? (params.position as BannerPosition)
      : "";
  const status = params.status === "active" || params.status === "inactive" ? params.status : "";
  const pageNum = Math.max(1, Number(params.page ?? 1) || 1);
  const from = (pageNum - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Ambil profil admin untuk shell (digunakan kedua-duanya)
  const { data: profile } = await supa
    .from("profiles")
    .select("full_name, email")
    .eq("id", session.userId)
    .maybeSingle();

  const adminName = profile?.full_name ?? null;
  const adminEmail = profile?.email ?? session.email;

  // Build query
  let query = supabaseAdmin
    .from("banners")
    .select(
      "id, title, image_url, position, status, sort_order, button_text, button_link, created_at",
      { count: "exact" }
    )
    .order("position", { ascending: true })
    .order("sort_order", { ascending: true })
    .range(from, to);

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }
  if (position) {
    query = query.eq("position", position);
  }
  if (status === "active") {
    query = query.eq("status", true);
  } else if (status === "inactive") {
    query = query.eq("status", false);
  }

  const { data, error, count } = await query;
  const banners = (data ?? []) as BannerRow[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminShell
      title="Banner Management"
      subtitle="Kelola banner hero, promo kanan atas, dan promo kanan bawah"
      adminName={adminName}
      adminEmail={adminEmail}
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d7ff53]">
            Marketing
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-black uppercase tracking-tight md:text-3xl">
            <ImageIcon size={22} strokeWidth={2.4} />
            Banner
          </h1>
          <p className="mt-1 text-sm text-white/55">
            Total {total} banner terdaftar.
          </p>
        </div>
        <Link
          href="/admin/banners/new"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-[#d7ff53] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black transition hover:bg-[#c7ef33]"
        >
          <Plus size={14} strokeWidth={2.5} />
          Tambah Banner
        </Link>
      </div>

      <BannersListClient
        banners={banners}
        total={total}
        page={pageNum}
        totalPages={totalPages}
        q={q}
        position={position}
        status={status}
        error={error?.message ?? null}
      />
    </AdminShell>
  );
}
