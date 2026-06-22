import AdminShell from "@/components/admin/AdminShell";
import ProductForm from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getStoreSettings } from "@/lib/storeSettings";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await requireAdmin();
  const settings = await getStoreSettings();
  const supabaseAdmin = getSupabaseAdmin();

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, email")
    .eq("id", session.userId)
    .maybeSingle();

  return (
    <AdminShell
      title="Tambah Produk Baru"
      subtitle="Lengkapi informasi produk untuk menambahkan ke katalog"
      adminName={profile?.full_name ?? null}
      adminEmail={profile?.email ?? null}
    >
      <ProductForm mode="create" initialData={{ status: "draft", is_new: true, is_preorder: false, min_purchase: 1, max_purchase: 0 }} />
    </AdminShell>
  );
}
