import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import ProductForm, { type ProductFormValues } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getStoreSettings } from "@/lib/storeSettings";

export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function EditProductPage({ params }: { params: Promise<Params> }) {
  const session = await requireAdmin();
  const { id } = await params;
  const supabaseAdmin = getSupabaseAdmin();
  const settings = await getStoreSettings();

  const [{ data: product }, { data: images }, { data: variants }, { data: profile }] =
    await Promise.all([
      supabaseAdmin.from("products").select("*").eq("id", id).maybeSingle(),
      supabaseAdmin
        .from("product_images")
        .select("id, image_url, storage_path, sort_order, is_primary, alt_text")
        .eq("product_id", id)
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("product_variants")
        .select("*")
        .eq("product_id", id)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("profiles")
        .select("full_name, email")
        .eq("id", session.userId)
        .maybeSingle(),
    ]);

  if (!product) {
    notFound();
  }

  const initialData: Partial<ProductFormValues> = {
    name: product.name ?? "",
    slug: product.slug ?? "",
    short_description: (product as any).short_description ?? "",
    description: product.description ?? "",
    category: product.category ?? "",
    brand: (product as any).brand ?? "",
    condition: (product as any).condition ?? "Baru",
    status: ((product as any).status ?? "draft") as ProductFormValues["status"],
    sku: (product as any).sku ?? "",
    base_price: product.price ?? 0,
    sale_price: (product as any).sale_price ?? null,
    stock: (product as any).stock ?? 0,
    weight: (product as any).weight ?? 0,
    length: (product as any).length_cm ?? (product as any).length ?? 0,
    width: (product as any).width_cm ?? (product as any).width ?? 0,
    height: (product as any).height_cm ?? (product as any).height ?? 0,
    has_variants: (product as any).has_variants ?? false,
    is_featured: (product as any).is_featured ?? false,
    is_new: (product as any).is_new ?? false,
    is_preorder: (product as any).is_preorder ?? false,
    preorder_days: (product as any).preorder_days ?? 0,
    min_purchase: (product as any).min_purchase ?? 1,
    max_purchase: (product as any).max_purchase ?? 0,
    seo_title: (product as any).seo_title ?? "",
    seo_description: (product as any).seo_description ?? "",
    internal_notes: (product as any).internal_notes ?? "",
    option_1_name: (product as any).option_1_name ?? "",
    option_1_values: (product as any).option_1_values ?? [],
    option_2_name: (product as any).option_2_name ?? "",
    option_2_values: (product as any).option_2_values ?? [],
    images: (images ?? []).map((img) => ({
      id: img.id,
      image_url: img.image_url,
      storage_path: img.storage_path ?? null,
      sort_order: img.sort_order ?? 0,
      is_primary: img.is_primary ?? false,
      alt_text: (img as any).alt_text ?? null,
      isNew: false,
    })),
    variants: (variants ?? []).map((va) => ({
      id: va.id,
      sku: (va as any).sku ?? "",
      option_1_name: (va as any).option_1_name ?? "",
      option_1_value: (va as any).option_1_value ?? "",
      option_2_name: (va as any).option_2_name ?? null,
      option_2_value: (va as any).option_2_value ?? null,
      price: (va as any).price ?? 0,
      sale_price: (va as any).sale_price ?? null,
      stock: (va as any).stock ?? 0,
      image_url: (va as any).image_url ?? null,
      is_active: (va as any).is_active ?? true,
      weight: (va as any).weight ?? null,
      isNew: false,
    })),
  };

  return (
    <AdminShell
      title={`Edit: ${product.name}`}
      subtitle="Perbarui informasi produk, foto, variasi, dan harga"
      adminName={profile?.full_name ?? null}
      adminEmail={profile?.email ?? null}
    >
      <ProductForm mode="edit" productId={id} initialData={initialData} />
    </AdminShell>
  );
}
