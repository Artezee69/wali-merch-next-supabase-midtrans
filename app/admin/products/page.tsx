import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import AdminProductsClient from "@/components/admin/AdminProductsClient";

export const dynamic = "force-dynamic";

// Server-side guard + render shell. The page itself is a server component
// so that unauthenticated visitors are redirected to /admin/login before
// any HTML reaches the browser. The interactive list lives in the client
// component imported above.
export default async function AdminProductsPage() {
  const session = await requireAdmin();
  const supabaseAdmin = getSupabaseAdmin();

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, email")
    .eq("id", session.userId)
    .maybeSingle();

  return (
    <AdminProductsClient
      adminName={profile?.full_name ?? null}
      adminEmail={profile?.email ?? null}
    />
  );
}
