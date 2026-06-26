import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { getAdminContext } from "@/lib/adminGuard";
import { isResponse } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateProductInput, validateVariants, isSlugAvailable, pickEffectivePrice } from "@/lib/productHelpers";
import { logAdminAction } from "@/lib/adminAudit";
import type { ProductCondition, ProductStatus } from "@/lib/productTypes";

// GET /api/admin/products/[id] — ambil detail produk
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminContext();
  if (isResponse(admin)) return admin;
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: product, error } = await supabaseAdmin
    .from("products")
    .select(
      `*, product_variants (
        id, option_1_name, option_1_value, option_2_name, option_2_value,
        sku, price, sale_price, stock, image_url, is_active, sort_order, weight,
        color, size
      ), product_images (
        id, image_url, storage_path, sort_order, is_primary
      )`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[API /api/admin/products/:id] GET error:", error.message);
    return NextResponse.json({ error: "Gagal memuat produk", details: error.message }, { status: 500 });
  }
  if (!product) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(
    { product },
    { headers: { "content-type": "application/json" } }
  );
}

// PATCH /api/admin/products/[id] — update produk
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminContext();
  if (isResponse(admin)) return admin;
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: productId } = await params;

  // Cek produk ada
  const { data: existing } = await supabaseAdmin
    .from("products")
    .select("id, slug, status")
    .eq("id", productId)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const input = body as Record<string, unknown>;

    const productInput = {
      name: typeof input.name === "string" ? input.name : undefined,
      slug: typeof input.slug === "string" ? input.slug : undefined,
      short_description: input.short_description !== undefined
        ? typeof input.short_description === "string" ? input.short_description : null
        : undefined,
      description: input.description !== undefined
        ? typeof input.description === "string" ? input.description : null
        : undefined,
      category: input.category !== undefined
        ? (typeof input.category === "string" ? input.category : null)
        : undefined,
      subcategory: input.subcategory !== undefined
        ? (typeof input.subcategory === "string" ? input.subcategory : null)
        : undefined,
      brand: input.brand !== undefined
        ? (typeof input.brand === "string" ? input.brand || null : null)
        : undefined,
      condition: input.condition !== undefined
        ? (input.condition === "new" || input.condition === "used" || input.condition === "refurbished"
          ? input.condition : undefined)
        : undefined,
      status: input.status !== undefined
        ? (["draft", "active", "inactive", "archived"].includes(typeof input.status === "string" ? input.status : "")
          ? (input.status as string) : undefined)
        : undefined,
      base_price: input.base_price !== undefined
        ? (typeof input.base_price === "number" ? input.base_price : null)
        : undefined,
      sale_price: input.sale_price !== undefined
        ? (typeof input.sale_price === "number" ? input.sale_price : null)
        : undefined,
      sku: input.sku !== undefined
        ? (typeof input.sku === "string" ? input.sku : null)
        : undefined,
      weight: input.weight !== undefined
        ? (typeof input.weight === "number" ? input.weight : null)
        : undefined,
      length: input.length !== undefined
        ? (typeof input.length === "number" ? input.length : null)
        : undefined,
      width: input.width !== undefined
        ? (typeof input.width === "number" ? input.width : null)
        : undefined,
      height: input.height !== undefined
        ? (typeof input.height === "number" ? input.height : null)
        : undefined,
      has_variants: input.has_variants !== undefined ? input.has_variants === true : undefined,
      is_featured: input.is_featured !== undefined ? input.is_featured === true : undefined,
      is_new: input.is_new !== undefined ? input.is_new === true : undefined,
      min_purchase: input.min_purchase !== undefined
        ? (typeof input.min_purchase === "number" && input.min_purchase >= 1 ? input.min_purchase : undefined)
        : undefined,
      max_purchase: input.max_purchase !== undefined
        ? (typeof input.max_purchase === "number" && input.max_purchase >= 1 ? input.max_purchase : undefined)
        : undefined,
      tags: input.tags !== undefined ? (Array.isArray(input.tags) ? input.tags : undefined) : undefined,
      seo_title: input.seo_title !== undefined
        ? (typeof input.seo_title === "string" ? input.seo_title || null : null)
        : undefined,
      seo_description: input.seo_description !== undefined
        ? (typeof input.seo_description === "string" ? input.seo_description || null : null)
        : undefined,
      seo_image_url: input.seo_image_url !== undefined
        ? (typeof input.seo_image_url === "string" ? input.seo_image_url || null : null)
        : undefined,
      is_preorder: input.is_preorder !== undefined ? input.is_preorder === true : undefined,
      preorder_processing_days: input.preorder_processing_days !== undefined
        ? (typeof input.preorder_processing_days === "number" ? input.preorder_processing_days : null)
        : undefined,
      admin_notes: input.admin_notes !== undefined
        ? (typeof input.admin_notes === "string" ? input.admin_notes || null : null)
        : undefined,
      stock: input.stock !== undefined
        ? (typeof input.stock === "number" && input.stock >= 0 ? input.stock : 0)
        : undefined,
    };

    // Coerce ProductInput fields to exact types
    type ParsedProductInput = {
      name?: string; slug?: string; short_description?: string; description?: string;
      category?: string; subcategory?: string; brand?: string;
      condition?: string; status?: string;
      base_price?: string | number; sale_price?: string | number;
      stock?: string | number; sku?: string; weight?: string | number;
      length?: string | number; width?: string | number; height?: string | number;
      has_variants?: string | boolean; is_featured?: string | boolean;
      min_purchase?: string | number; max_purchase?: string | number;
      seo_title?: string; seo_description?: string; internal_notes?: string;
      pre_order?: string | boolean; pre_order_days?: string | number;
      sort_order?: string | number;
    };
    const pi = productInput as ParsedProductInput;
    const coercedInput: Parameters<typeof validateProductInput>[0] = {
      name: pi.name ?? "",
      slug: pi.slug ?? "",
      short_description: pi.short_description,
      description: pi.description,
      category: pi.category,
      subcategory: pi.subcategory,
      brand: pi.brand,
      condition: (pi.condition as "new" | "used" | "refurbished" | null | undefined) ?? undefined,
      status: (pi.status as "draft" | "active" | "inactive" | "archived" | null | undefined) ?? undefined,
      base_price: productInput.base_price,
      sale_price: productInput.sale_price,
      sku: productInput.sku,
      weight: productInput.weight,
      length: productInput.length,
      width: productInput.width,
      height: productInput.height,
      has_variants: productInput.has_variants,
      is_featured: productInput.is_featured,
      is_new: productInput.is_new,
      min_purchase: productInput.min_purchase,
      max_purchase: productInput.max_purchase,
      tags: productInput.tags,
      seo_title: productInput.seo_title,
      seo_description: productInput.seo_description,
      seo_image_url: productInput.seo_image_url,
      is_preorder: productInput.is_preorder,
      preorder_processing_days: productInput.preorder_processing_days,
      admin_notes: productInput.admin_notes,
    };

    // Validasi
    const prodValidation = validateProductInput(coercedInput);
    if (!prodValidation.valid) {
      return NextResponse.json({ error: "Validasi gagal", errors: prodValidation.errors }, { status: 400 });
    }

    // Cek slug unik (kecuali slug yang sama)
    if (productInput.slug && productInput.slug !== existing.slug) {
      const slugAvailable = await isSlugAvailable(productInput.slug!, productId);
      if (!slugAvailable) {
        return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 409 });
      }
    }

    // Hitung total stok dari varian sebelum update
    const { data: variantsBefore } = await supabaseAdmin
      .from("product_variants")
      .select("stock")
      .eq("product_id", productId);

    const buildUpdate: Record<string, unknown> = {};

    if (productInput.name !== undefined) buildUpdate.name = productInput.name;
    if (productInput.slug !== undefined) buildUpdate.slug = productInput.slug;
    if (productInput.short_description !== undefined) buildUpdate.short_description = productInput.short_description;
    if (productInput.description !== undefined) buildUpdate.description = productInput.description;
    if (productInput.category !== undefined) buildUpdate.category = productInput.category;
    if (productInput.subcategory !== undefined) buildUpdate.subcategory = productInput.subcategory;
    if (productInput.brand !== undefined) buildUpdate.brand = productInput.brand;
    if (productInput.condition !== undefined) buildUpdate.condition = productInput.condition as ProductCondition;
    if (productInput.status !== undefined) buildUpdate.status = productInput.status as ProductStatus;
    if (productInput.base_price !== undefined) buildUpdate.base_price = productInput.base_price;
    if (productInput.sale_price !== undefined) buildUpdate.sale_price = productInput.sale_price;
    if (productInput.sku !== undefined) buildUpdate.sku = productInput.sku;
    if (productInput.weight !== undefined) buildUpdate.weight = productInput.weight;
    if (productInput.length !== undefined) buildUpdate.length = productInput.length;
    if (productInput.width !== undefined) buildUpdate.width = productInput.width;
    if (productInput.height !== undefined) buildUpdate.height = productInput.height;
    if (productInput.has_variants !== undefined) buildUpdate.has_variants = productInput.has_variants;
    if (productInput.is_featured !== undefined) buildUpdate.is_featured = productInput.is_featured;
    if (productInput.is_new !== undefined) buildUpdate.is_new = productInput.is_new;
    if (productInput.min_purchase !== undefined) buildUpdate.min_purchase = productInput.min_purchase;
    if (productInput.max_purchase !== undefined) buildUpdate.max_purchase = productInput.max_purchase;
    if (productInput.tags !== undefined) buildUpdate.tags = productInput.tags;
    if (productInput.seo_title !== undefined) buildUpdate.seo_title = productInput.seo_title;
    if (productInput.seo_description !== undefined) buildUpdate.seo_description = productInput.seo_description;
    if (productInput.seo_image_url !== undefined) buildUpdate.seo_image_url = productInput.seo_image_url;
    if (productInput.is_preorder !== undefined) buildUpdate.is_preorder = productInput.is_preorder;
    if (productInput.preorder_processing_days !== undefined) buildUpdate.preorder_processing_days = productInput.preorder_processing_days;
    if (productInput.admin_notes !== undefined) buildUpdate.admin_notes = productInput.admin_notes;

    // Sinkronisasi field legacy (price)
    if (productInput.base_price !== undefined || productInput.sale_price !== undefined) {
      buildUpdate.price = pickEffectivePrice({
        base_price: productInput.base_price ?? null,
        sale_price: productInput.sale_price ?? null,
      });
    }

    // is_active = true hanya jika status = active
    if (productInput.status !== undefined) {
      buildUpdate.is_active = productInput.status === "active";
    }

    // Jika status berubah, catat sebelum/sesudah
    const before: Record<string, unknown> = { status: existing.status };
    const after: Record<string, unknown> = {};
    if (productInput.status) after.status = productInput.status;

    // Update produk
    const { error: updateError } = await supabaseAdmin
      .from("products")
      .update(buildUpdate)
      .eq("id", productId);

    if (updateError) {
      console.error("[API /api/admin/products/:id] PATCH error:", updateError.message);
      return NextResponse.json({ error: "Gagal memperbarui produk", details: updateError.message }, { status: 500 });
    }

    // === Handle variants ===
    // variants array: setiap item punya id (ada = update, tidak ada = insert)
    const rawVariants = input.variants as Array<Record<string, unknown>> | undefined;
    if (rawVariants && rawVariants.length > 0) {
      const varValidation = validateVariants(rawVariants as any);
      if (!varValidation.valid) {
        return NextResponse.json(
          { error: "Validasi varian gagal", errors: varValidation.errors },
          { status: 400 }
        );
      }

      // Process each variant
      for (const v of rawVariants) {
        const variantData = {
          product_id: productId,
          option_1_name: v.option_1_name || null,
          option_1_value: v.option_1_value || null,
          option_2_name: v.option_2_name || null,
          option_2_value: v.option_2_value || null,
          sku: typeof v.sku === "string" ? v.sku || null : null,
          price: typeof v.price === "number" ? v.price : null,
          sale_price: typeof v.sale_price === "number" ? v.sale_price : null,
          stock: typeof v.stock === "number" && v.stock >= 0 ? v.stock : 0,
          image_url: typeof v.image_url === "string" ? v.image_url || null : null,
          is_active: v.is_active !== false,
          sort_order: typeof v.sort_order === "number" ? v.sort_order : 0,
          weight: typeof v.weight === "number" ? v.weight : null,
          color: v.option_1_value || null,
          size: v.option_2_value || null,
        };

        const variantId = v.id as string | undefined;
        if (variantId) {
          // Update varian yang ada — jangan hapus jika ada di order_items
          const { data: existingVariant } = await supabaseAdmin
            .from("product_variants")
            .select("id")
            .eq("id", variantId)
            .eq("product_id", productId)
            .maybeSingle();

          if (existingVariant) {
            // Check order_items
            const { count: oiCount } = await supabaseAdmin
              .from("order_items")
              .select("id", { count: "exact", head: true })
              .eq("variant_id", variantId);

            if ((oiCount ?? 0) > 0) {
              // Jika pernah dipesan, jangan hapus, hanya nonaktifkan
              variantData.is_active = false;
            }

            const { error: updateVarErr } = await supabaseAdmin
              .from("product_variants")
              .update(variantData)
              .eq("id", variantId);
            if (updateVarErr) {
              console.error("[API /api/admin/products/:id] variant update error:", updateVarErr.message);
              return NextResponse.json(
                { error: "Gagal memperbarui varian", details: updateVarErr.message },
                { status: 500 }
              );
            }
          } else {
            // ID diberikan tapi tidak ditemukan — abaikan (mungkin sudah dihapus sebelumnya)
          }
        } else {
          // Insert varian baru
          const { error: insertVarErr } = await supabaseAdmin
            .from("product_variants")
            .insert(variantData);
          if (insertVarErr) {
            console.error("[API /api/admin/products/:id] variant insert error:", insertVarErr.message);
            return NextResponse.json(
              { error: "Gagal membuat varian", details: insertVarErr.message },
              { status: 500 }
            );
          }
        }
      }

      // Hapus varian yang tidak ada di list (yang tidak pernah dipesan)
      const ids = rawVariants.map((v) => v.id as string | undefined).filter(Boolean) as string[];
      if (ids.length > 0) {
        // Hapus varian lama yang tidak ada di list baru, bukan primary, belum pernah dipesan
        const { data: oldVariants } = await supabaseAdmin
          .from("product_variants")
          .select("id")
          .eq("product_id", productId)
          .filter("id", "not", ids);

        if (oldVariants) {
          for (const ov of oldVariants as { id: string }[]) {
            const { count: oiCount } = await supabaseAdmin
              .from("order_items")
              .select("id", { count: "exact", head: true })
              .eq("variant_id", ov.id);

            if ((oiCount ?? 0) === 0) {
              await supabaseAdmin.from("product_variants").delete().eq("id", ov.id);
            } else {
              await supabaseAdmin
                .from("product_variants")
                .update({ is_active: false })
                .eq("id", ov.id);
            }
          }
        }
      }

      // Soft-delete variants marked as toDelete (user clicked trash in UI).
      const deletedVariants = rawVariants
        .filter((v) => (v as any).toDelete === true)
        .map((v) => v.id)
        .filter(Boolean) as string[];
      if (deletedVariants.length > 0) {
        const { error: softErr } = await supabaseAdmin
          .from("product_variants")
          .update({ is_active: false, stock: 0 })
          .in("id", deletedVariants);
        if (softErr) {
          console.error("[API /api/admin/products/:id] soft-delete variants error:", softErr.message);
          return NextResponse.json({ error: "Gagal menghapus varian", details: softErr.message }, { status: 500 });
        }
      }

      // Recompute total stock and price range from all active variants.
      const { data: allVariants, error: fetchErr } = await supabaseAdmin
        .from("product_variants")
        .select("stock, price, sale_price, is_active")
        .eq("product_id", productId);
      if (!fetchErr) {
        const active = (allVariants ?? []).filter((v) => v.is_active !== false);
        const totalStock = active.reduce((s, v) => s + (v.stock || 0), 0);
        const minPrice = active.length
          ? Math.min(
              ...active.map((v) =>
                v.sale_price != null ? v.sale_price : (v.price || 0),
              ),
            )
          : (input.base_price ?? 0);

        await supabaseAdmin
          .from("products")
          .update({
            has_variants: rawVariants.length > 0,
            stock: totalStock,
            base_price: minPrice,
          })
          .eq("id", productId);
      }
    }

    // Log
    await logAdminAction({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "product.updated",
      entity: "product",
      entityId: productId,
      before,
      after,
    });

    return NextResponse.json(
      { success: true, product: { id: productId, ...buildUpdate } },
      { headers: { "content-type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[API /api/admin/products/:id] PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id] — hapus produk
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminContext();
  if (isResponse(admin)) return admin;
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: productId } = await params;

  const { data: before } = await supabaseAdmin
    .from("products")
    .select("name, slug")
    .eq("id", productId)
    .maybeSingle();

  // Check order_items
  const { count: oiCount } = await supabaseAdmin
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  if ((oiCount ?? 0) > 0) {
    // Soft-delete: nonaktifkan
    const { error } = await supabaseAdmin
      .from("products")
      .update({ is_active: false, status: "inactive" })
      .eq("id", productId);

    if (error) {
      console.error("[API /api/admin/products/:id] DELETE soft error:", error.message);
      return NextResponse.json({ error: "Gagal menonaktifkan produk" }, { status: 500 });
    }

    await logAdminAction({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "product.deleted",
      entity: "product",
      entityId: productId,
      before,
      after: { status: "inactive", reason: "has_orders" },
    });

    return NextResponse.json({ success: true, soft_deleted: true }, { headers: { "content-type": "application/json" } });
  }

  // Hard delete
  const { error } = await supabaseAdmin.from("products").delete().eq("id", productId);
  if (error) {
    console.error("[API /api/admin/products/:id] DELETE hard error:", error.message);
    return NextResponse.json({ error: "Gagal menghapus produk" }, { status: 500 });
  }

  await logAdminAction({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "product.deleted",
    entity: "product",
    entityId: productId,
    before,
    after: { deleted: true },
  });

  return NextResponse.json({ success: true, hard_deleted: true }, { headers: { "content-type": "application/json" } });
}
