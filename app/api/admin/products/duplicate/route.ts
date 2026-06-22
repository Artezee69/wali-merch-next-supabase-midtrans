import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { getAdminContext, isResponse } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateUniqueSlug } from "@/lib/productHelpers";
import { logAdminAction } from "@/lib/adminAudit";

// POST /api/admin/products/duplicate — duplikasi produk
// Body: { id: string }
export async function POST(request: NextRequest) {
  const admin = await getAdminContext();
  if (isResponse(admin)) return admin;
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const sourceId = body.id as string | undefined;

    if (!sourceId) {
      return NextResponse.json({ error: "ID sumber wajib diisi" }, { status: 400 });
    }

    // Ambil source product
    const { data: source, error: srcErr } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", sourceId)
      .maybeSingle();

    if (srcErr || !source) {
      return NextResponse.json({ error: "Produk sumber tidak ditemukan" }, { status: 404 });
    }

    // Ambil varian source
    const { data: sourceVariants } = await supabaseAdmin
      .from("product_variants")
      .select("*")
      .eq("product_id", sourceId);

    // Buat produk baru dengan menyalin semua field
    const newName = `${source.name} (Copy)`;
    const newSlug = generateUniqueSlug(newName);

    const { data: newProduct, error: createErr } = await supabaseAdmin
      .from("products")
      .insert({
        name: newName,
        slug: newSlug,
        short_description: source.short_description,
        description: source.description,
        category: source.category,
        subcategory: source.subcategory,
        brand: source.brand,
        condition: source.condition,
        status: "draft", // Default ke draft agar tidak langsung publik
        base_price: source.base_price,
        sale_price: source.sale_price,
        price: source.price,
        sku: null, // SKU dibuat unik
        weight: source.weight,
        length: source.length,
        width: source.width,
        height: source.height,
        has_variants: source.has_variants,
        is_featured: false,
        is_new: false,
        min_purchase: source.min_purchase,
        max_purchase: source.max_purchase,
        tags: source.tags,
        seo_title: source.seo_title,
        seo_description: source.seo_description,
        seo_image_url: source.seo_image_url,
        is_preorder: source.is_preorder,
        preorder_processing_days: source.preorder_processing_days,
        admin_notes: source.admin_notes,
        is_active: false,
      })
      .select()
      .single();

    if (createErr || !newProduct) {
      console.error("[API /api/admin/products/duplicate] create error:", createErr?.message);
      return NextResponse.json(
        { error: "Gagal menduplikasi produk", details: createErr?.message },
        { status: 500 }
      );
    }

    // Duplikasi varian
    if (sourceVariants && sourceVariants.length > 0) {
      const newVariants = (sourceVariants as Array<Record<string, unknown>>).map((v) => ({
        product_id: newProduct.id,
        option_1_name: v.option_1_name,
        option_1_value: v.option_1_value,
        option_2_name: v.option_2_name,
        option_2_value: v.option_2_value,
        sku: null, // SKU duplikat harus dibuat berbeda
        price: v.price,
        sale_price: v.sale_price,
        stock: v.stock,
        image_url: v.image_url, // Gambar yang sama boleh dipakai
        is_active: v.is_active,
        sort_order: v.sort_order,
        weight: v.weight,
        color: v.option_1_value ?? v.color,
        size: v.option_2_value ?? v.size,
      }));

      await supabaseAdmin.from("product_variants").insert(newVariants);
    }

    // Catatan: foto tidak diduplikasi, admin harus upload ulang untuk produk duplikat
    // untuk menghindari penumpukan storage dari foto yang sama.

    await logAdminAction({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "product.created",
      entity: "product",
      entityId: newProduct.id,
      metadata: { duplicated_from: sourceId },
      after: { name: newName, status: "draft", source: sourceId },
    });

    return NextResponse.json(
      {
        success: true,
        product: {
          id: newProduct.id,
          name: newProduct.name,
          slug: newProduct.slug,
        },
      },
      { status: 201, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("[API /api/admin/products/duplicate] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
