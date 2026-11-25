import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

import EmployeeSalesClient from "@/components/admin/EmployeeSalesClient";

export default async function AdminEmployeeSalesPage() {
  const session = await requireAdmin();
  const supabaseAdmin = getSupabaseAdmin();

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, email")
    .eq("id", session.userId)
    .maybeSingle();

  return (
    <EmployeeSalesClient
      adminName={profile?.full_name ?? null}
      adminEmail={profile?.email ?? null}
    />
  );
}
