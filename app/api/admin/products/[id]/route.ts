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

  // Sort embedded product_images by sort_order
  if (Array.isArray((product as any).product_images)) {
    (product as any).product_images = [...(product as any).product_images].sort(
      (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
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
    console.log("[PATCH] body keys:", Object.keys(input).join(", "));

    // Map form field aliases to canonical DB/API field names.
    const preorderProcessingDays =
      input.preorder_processing_days ?? input.preorder_days;
    const adminNotes = input.admin_notes ?? input.internal_notes;

    // Map display labels (Baru/Bekas) to canonical DB values (new/used/refurbished).
    const CONDITION_LABEL_MAP: Record<string, string> = {
      "Baru": "new",
      "Bekas - Seperti Baru": "used",
      "Bekas - Bagus": "used",
      "Bekas - Wajar": "used",
    };
    const rawCondition = typeof input.condition === "string" ? input.condition : undefined;
    const condition = rawCondition ? (CONDITION_LABEL_MAP[rawCondition] ?? rawCondition) : rawCondition;

    // Fast path: if only status is being toggled, do a targeted update
    const hasOnlyStatus = Object.keys(input).length === 1 && input.status !== undefined;
    if (hasOnlyStatus) {
      const statusVal = input.status as string;
      const newStatus = ["draft", "active", "inactive", "archived"].includes(statusVal)
        ? statusVal
        : null;

      if (!newStatus) {
        return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
      }

      const is_active = newStatus === "active";
      const { error: updateError } = await supabaseAdmin
        .from("products")
        .update({ status: newStatus, is_active })
        .eq("id", productId);

      if (updateError) {
        console.error("[PATCH] Toggle status error:", updateError.message);
        return NextResponse.json({ error: "Gagal mengubah status" }, { status: 500 });
      }

      await logAdminAction({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "product.updated",
        entity: "product",
        entityId: productId,
        before: { status: existing.status },
        after: { status: newStatus },
      });

      return NextResponse.json(
        { success: true, product: { id: productId, status: newStatus, is_active } },
        { headers: { "content-type": "application/json" } }
      );
    }

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
      condition: condition,
      status: input.status !== undefined
        ? (["draft", "active", "inactive", "archived"].includes(typeof input.status === "string" ? input.status : "")
          ? (input.status as string) : undefined)
        : undefined,
      base_price: input.base_price !== undefined && input.base_price !== ""
        ? (Number(input.base_price) || null)
        : undefined,
      sale_price: input.sale_price !== undefined
        ? (input.sale_price === null || input.sale_price === "" ? null : (Number(input.sale_price) || null))
        : undefined,
      sku: input.sku !== undefined
        ? (typeof input.sku === "string" ? input.sku : null)
        : undefined,
      weight: input.weight !== undefined
        ? (Number(input.weight) || null)
        : undefined,
      length: input.length !== undefined
        ? (Number(input.length) || null)
        : undefined,
      width: input.width !== undefined
        ? (Number(input.width) || null)
        : undefined,
      height: input.height !== undefined
        ? (Number(input.height) || null)
        : undefined,
      has_variants: input.has_variants !== undefined ? (input.has_variants === true || input.has_variants === "true") : undefined,
      is_featured: input.is_featured !== undefined ? (input.is_featured === true || input.is_featured === "true") : undefined,
      is_new: input.is_new !== undefined ? (input.is_new === true || input.is_new === "true") : undefined,
      min_purchase: input.min_purchase !== undefined && input.min_purchase !== ""
        ? (Number(input.min_purchase) >= 1 ? Number(input.min_purchase) : undefined)
        : undefined,
      max_purchase: input.max_purchase !== undefined && input.max_purchase !== ""
        ? (Number(input.max_purchase) >= 1 ? Number(input.max_purchase) : undefined)
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
      is_preorder: input.is_preorder !== undefined ? (input.is_preorder === true || input.is_preorder === "true") : undefined,
      preorder_processing_days: (input.preorder_processing_days ?? input.preorder_days) !== undefined && (input.preorder_processing_days ?? input.preorder_days) !== ""
        ? (Number(input.preorder_processing_days ?? input.preorder_days) || null)
        : undefined,
      admin_notes: input.admin_notes !== undefined
        ? (typeof input.admin_notes === "string" ? input.admin_notes || null : null)
        : undefined,
      // NOTE: `stock` TIDAK diset ke tabel products karena kolom itu
      // tidak ada. Stok total dihitung dari product_variants.stock (lihat
      // updateVariantStocks() di bawah).
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
    const toNum2 = (v: unknown): number | null | undefined => {
      if (v == null || v === "" || v === "null") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };
    const toBool = (v: unknown): boolean | undefined =>
      v == null ? undefined : v === true || v === "true" || v === 1;
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
      base_price: toNum2(productInput.base_price),
      sale_price: toNum2(productInput.sale_price),
      sku: productInput.sku,
      weight: toNum2(productInput.weight),
      length: toNum2(productInput.length),
      width: toNum2(productInput.width),
      height: toNum2(productInput.height),
      has_variants: toBool(productInput.has_variants),
      is_featured: toBool(productInput.is_featured),
      is_new: toBool(productInput.is_new),
      min_purchase: toNum2(productInput.min_purchase) ?? undefined,
      max_purchase: toNum2(productInput.max_purchase) ?? undefined,
      tags: productInput.tags,
      seo_title: productInput.seo_title,
      seo_description: productInput.seo_description,
      seo_image_url: productInput.seo_image_url,
      is_preorder: toBool(productInput.is_preorder),
      preorder_processing_days: toNum2(productInput.preorder_processing_days),
      admin_notes: productInput.admin_notes,
    };

    // Validasi
    const prodValidation = validateProductInput(coercedInput);
    console.log("[PATCH] valid input keys:", Object.keys(coercedInput).filter((k) => (coercedInput as Record<string, unknown>)[k] !== undefined).join(", "));
    if (!prodValidation.valid) {
      console.log("[PATCH] validation errors:", JSON.stringify(prodValidation.errors));
      return NextResponse.json({ error: "Validasi gagal", errors: prodValidation.errors }, { status: 400 });
    }
    console.log("[PATCH] validation PASSED");

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

    const toNum = (v: unknown): number | null => {
      if (v == null || v === "" || v === "null") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    if (productInput.name !== undefined) buildUpdate.name = productInput.name;
    if (productInput.slug !== undefined) buildUpdate.slug = productInput.slug;
    if (productInput.short_description !== undefined) buildUpdate.short_description = productInput.short_description;
    if (productInput.description !== undefined) buildUpdate.description = productInput.description;
    if (productInput.category !== undefined) buildUpdate.category = productInput.category;
    if (productInput.subcategory !== undefined) buildUpdate.subcategory = productInput.subcategory;
    if (productInput.brand !== undefined) buildUpdate.brand = productInput.brand;
    if (productInput.condition !== undefined) buildUpdate.condition = productInput.condition as ProductCondition;
    if (productInput.status !== undefined) buildUpdate.status = productInput.status as ProductStatus;
    if (productInput.base_price !== undefined) buildUpdate.base_price = toNum(productInput.base_price);
    if (productInput.sale_price !== undefined) buildUpdate.sale_price = toNum(productInput.sale_price);
    if (productInput.sku !== undefined) buildUpdate.sku = productInput.sku;
    if (productInput.weight !== undefined) buildUpdate.weight = toNum(productInput.weight);
    if (productInput.length !== undefined) buildUpdate.length = toNum(productInput.length);
    if (productInput.width !== undefined) buildUpdate.width = toNum(productInput.width);
    if (productInput.height !== undefined) buildUpdate.height = toNum(productInput.height);
    if (productInput.has_variants !== undefined) buildUpdate.has_variants = productInput.has_variants === true || (productInput.has_variants as unknown as string) === "true";
    if (productInput.is_featured !== undefined) buildUpdate.is_featured = productInput.is_featured === true || (productInput.is_featured as unknown as string) === "true";
    if (productInput.is_new !== undefined) buildUpdate.is_new = productInput.is_new === true || (productInput.is_new as unknown as string) === "true";
    if (productInput.min_purchase !== undefined) buildUpdate.min_purchase = toNum(productInput.min_purchase);
    if (productInput.max_purchase !== undefined) buildUpdate.max_purchase = toNum(productInput.max_purchase);
    if (productInput.tags !== undefined) buildUpdate.tags = productInput.tags;
    if (productInput.seo_title !== undefined) buildUpdate.seo_title = productInput.seo_title;
    if (productInput.seo_description !== undefined) buildUpdate.seo_description = productInput.seo_description;
    if (productInput.seo_image_url !== undefined) buildUpdate.seo_image_url = productInput.seo_image_url;
    if (productInput.is_preorder !== undefined) buildUpdate.is_preorder = productInput.is_preorder === true || (productInput.is_preorder as unknown as string) === "true";
    if (productInput.preorder_processing_days !== undefined) buildUpdate.preorder_processing_days = toNum(productInput.preorder_processing_days);
    if (productInput.admin_notes !== undefined) buildUpdate.admin_notes = productInput.admin_notes;

    // Sinkronisasi field legacy (price)
    if (productInput.base_price !== undefined || productInput.sale_price !== undefined) {
      buildUpdate.price = pickEffectivePrice({
        base_price: toNum(productInput.base_price) ?? null,
        sale_price: toNum(productInput.sale_price) ?? null,
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
    console.log("[PATCH] update payload:", JSON.stringify(buildUpdate));
    const { error: updateError, data } = await supabaseAdmin
      .from("products")
      .update(buildUpdate)
      .eq("id", productId)
      .select("id, status, is_active")
      .single();

    if (updateError) {
      console.error("[PATCH] full update error:", updateError.message);
    }

    if (updateError) {
      console.error("[API /api/admin/products/:id] PATCH error:", updateError.message);
      return NextResponse.json({ error: "Gagal memperbarui produk", details: updateError.message }, { status: 500 });
    }

    // === Sync image sort_order ===
    const rawImages = input.images as Array<Record<string, unknown>> | undefined;
    if (rawImages && Array.isArray(rawImages)) {
      for (let i = 0; i < rawImages.length; i++) {
        const img = rawImages[i];
        const imgId = img.id as string | undefined;
        if (imgId) {
          const { error: imgUpdateErr } = await supabaseAdmin
            .from("product_images")
            .update({ sort_order: i, is_primary: i === 0 })
            .eq("id", imgId);

          if (imgUpdateErr) {
            console.error("[API /api/admin/products/:id] image sort_order update error:", imgUpdateErr.message);
            return NextResponse.json(
              { error: "Gagal menyimpan urutan foto", details: imgUpdateErr.message },
              { status: 500 }
            );
          }
        }
      }
      // Mark images that were deleted
      const ids = rawImages.map((img) => img.id as string | undefined).filter(Boolean) as string[];
      if (ids.length > 0) {
        const { data: oldImages } = await supabaseAdmin
          .from("product_images")
          .select("id")
          .eq("product_id", productId)
          .not("id", "in", ids);
        if (oldImages) {
          for (const oi of oldImages as { id: string }[]) {
            const { error: deleteErr } = await supabaseAdmin
              .from("product_images")
              .delete()
              .eq("id", oi.id);
            if (deleteErr) {
              console.error("[API /api/admin/products/:id] image delete error:", deleteErr.message);
            }
          }
        }
      }
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
          option_1_name: (v.option_1_name || "Color").toString(),
          option_1_value: (v.option_1_value || "").toString() || null,
          option_2_name: (v.option_2_name || "Size").toString(),
          option_2_value: (v.option_2_value || "").toString() || null,
          sku: typeof v.sku === "string" ? v.sku || null : null,
          price: Number(v.price) || 0,
          sale_price: v.sale_price !== undefined && v.sale_price !== null ? Number(v.sale_price) || null : null,
          stock: Number(v.stock) || 0,
          image_url: typeof v.image_url === "string" ? v.image_url || null : null,
          is_active: v.is_active !== false,
          sort_order: Number(v.sort_order) || 0,
          weight: v.weight !== undefined && v.weight !== null ? Number(v.weight) || null : null,
          // Legacy — fallback non-null untuk kolom NOT NULL constraint
          color: (v.option_1_value || "Default").toString(),
          size: (v.option_2_value || "Default").toString(),
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

      // Soft-disable varian yang tidak ada di list (bukan hard delete)
      // Ini mencegah hilangnya data jika form mengirim payload tidak lengkap
      // (misal admin rename opsi lalu restore-nya, atau uncheck "produk memiliki variasi")
      const ids = rawVariants
        .filter((v) => !((v as any).toDelete === true))
        .map((v) => v.id as string | undefined)
        .filter(Boolean) as string[];
      if (ids.length > 0) {
        const { data: oldVariants } = await supabaseAdmin
          .from("product_variants")
          .select("id")
          .eq("product_id", productId)
          .not("id", "in", ids);

        if (oldVariants && oldVariants.length > 0) {
          // Semua varian yang hilang dari payload di-disable (bukan dihapus),
          // termasuk yang belum pernah dipesan. Reactivation cukup dengan
          // update is_active=true + restock saat admin ingin menghidupkannya lagi.
          const oldIds = (oldVariants as { id: string }[]).map((v) => v.id);
          const { error: softErr } = await supabaseAdmin
            .from("product_variants")
            .update({ is_active: false })
            .in("id", oldIds);
          if (softErr) {
            console.warn(
              "[PATCH] gagal soft-disable varian lama:",
              softErr.message
            );
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

      // Recompute price range from all active variants.
      // NOTE: kolom `stock` TIDAK ADA di `products`. Stok total dihitung
      // di product_variants.stock; clients harus sum variannya.
      const { data: allVariants, error: fetchErr } = await supabaseAdmin
        .from("product_variants")
        .select("stock, price, sale_price, is_active")
        .eq("product_id", productId);
      if (!fetchErr) {
        const active = (allVariants ?? []).filter((v) => v.is_active !== false);

        // base_price = min variant NORMAL price (pre-discount)
        const minBase = active.length
          ? Math.min(...active.map((v) => Number(v.price) || 0))
          : (input.base_price ?? 0);

        // Effective price = min of (sale_price ?? price) — what customer pays
        const minEffective = active.length
          ? Math.min(
              ...active.map((v) =>
                v.sale_price != null ? v.sale_price : (v.price || 0),
              ),
            )
          : minBase;

        // Products-level sale_price: lowest variant sale_price (null if no variant has discount)
        const salesOnly = active.filter((v) => v.sale_price != null && Number(v.sale_price) > 0);
        const minSale = salesOnly.length > 0
          ? Math.min(...salesOnly.map((v) => Number(v.sale_price)))
          : null;

        await supabaseAdmin
          .from("products")
          .update({
            has_variants: rawVariants.length > 0,
            base_price: minBase,
            price: minEffective,
            sale_price: minSale,
          })
          .eq("id", productId);

        // For non-variant products, save stock directly
        if (rawVariants.length === 0 && typeof input.stock === "number") {
          const { error: stockErr } = await supabaseAdmin
            .from("products")
            .update({ stock: input.stock })
            .eq("id", productId);
          if (stockErr) {
            console.warn("[PATCH] stock update failed:", stockErr.message);
          }
        }
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
    console.error("[API /api/admin/products/:id] PATCH FATAL error:", err);
    console.error("[PATCH] stack:", (err as Error).stack);
    return NextResponse.json({ error: "Internal server error", details: (err as Error).message }, { status: 500 });
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
