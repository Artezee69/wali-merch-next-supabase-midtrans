import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

import HppCalculatorClient from "@/components/admin/HppCalculatorClient";

export default async function AdminFinancePage() {
  const session = await requireAdmin();
  const supabaseAdmin = getSupabaseAdmin();

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, email")
    .eq("id", session.userId)
    .maybeSingle();

  return (
    <HppCalculatorClient
      adminName={profile?.full_name ?? null}
      adminEmail={profile?.email ?? null}
    />
  );
}
