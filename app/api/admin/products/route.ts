import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { getAdminContext } from "@/lib/adminGuard";
import { isResponse } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  validateProductInput,
  validateVariants,
  generateUniqueSlug,
  slugify,
  isSlugAvailable,
  pickEffectivePrice,
} from "@/lib/productHelpers";
import { logAdminAction } from "@/lib/adminAudit";

// GET /api/admin/products — list produk dengan filter, pencarian, sort
export async function GET(request: NextRequest) {
  const admin = await getAdminContext();
  if (isResponse(admin)) return admin;
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const perPage = Math.min(50, Math.max(1, Number(searchParams.get("per_page") || 20)));
  const q = (searchParams.get("q") || "").trim();
  const status = searchParams.get("status") || "";
  const stockFilter = searchParams.get("stock") || "";
  const category = searchParams.get("category") || "";
  const sortBy = searchParams.get("sort_by") || "updated_at";
  const orderDir = (searchParams.get("order") || "desc") === "desc" ? "desc" : "asc";

  // Build query
  // CATATAN: query ini hanya memilih kolom yang ada di schema produksi saat ini.
  // Kolom `option_*`, `sku`, `price`, `sale_price`, `image_url`, `is_active`,
  // `sort_order`, `weight` pada `product_variants` DAN kolom `is_primary`/
  // `storage_path` pada `product_images` belum dimigrasikan ke production.
  // Kita pilih kolom legacy yang pasti ada agar endpoint tidak 500.
  let query = supabaseAdmin
    .from("products")
    .select(
      `*, product_variants (id, size, color, stock), product_images (id, image_url, sort_order)`,
      { count: "exact" }
    );

  // Pencarian
  // CATATAN: kolom `sku` dan `brand` belum ada di tabel `products` production.
  if (q) {
    query = query.or(
      `name.ilike.%${q}%,slug.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`
    );
  }

  // Filter status
  if (status && ["draft", "active", "inactive", "archived"].includes(status)) {
    query = query.eq("status", status);
  }

  // Filter kategori
  if (category) {
    query = query.eq("category", category);
  }

  // Sort
  // CATATAN: hanya kolom yang ada di schema produksi saat ini yang boleh dipakai untuk sort.
  // `updated_at` dan `base_price` belum ada di tabel `products` production, jadi
  // "Terakhir Diubah" di page dipetakan ke `created_at`, dan "Harga" ke `price`.
  const sortAlias: Record<string, string> = {
    updated_at: "created_at",
    base_price: "price",
  };
  const requested = sortAlias[sortBy] ?? sortBy;
  const allowedSorts = ["created_at", "name", "price"];
  const sortCol = allowedSorts.includes(requested) ? requested : "created_at";
  query = query.order(sortCol, { ascending: orderDir === "asc" });

  // Pagination
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data: productsRaw, error, count } = await query;
  if (error) {
    console.error("[API /api/admin/products] GET error:", error.message);
    return NextResponse.json(
      { error: "Gagal memuat produk", details: error.message },
      { status: 500 }
    );
  }

  const products = (productsRaw ?? []) as Array<Record<string, unknown>>;

  // Hitung stok total dan harga range per produk
  const enriched = products.map((p) => {
    const variants = (p.product_variants as Array<Record<string, unknown>> | undefined) ?? [];
    const stock = variants.reduce((sum: number, v: Record<string, unknown>) => {
      return sum + Number((v as any).stock || 0);
    }, 0);
    // Schema produksi saat ini tidak punya kolom price/sale_price di product_variants,
    // sehingga range harga hanya didasarkan pada harga produk (legacy `price`).
    const productPrice = Number((p as any).price ?? (p as any).base_price ?? 0);
    const allPrices = [productPrice].filter((n: number) => n > 0);
    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
    const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;

    const images = (p.product_images as Array<Record<string, unknown>> | undefined) ?? [];
    // Schema produksi tidak punya `is_primary`; ambil gambar pertama berdasarkan sort_order.
    const sortedImages = [...images].sort(
      (a, b) => Number((a as any).sort_order ?? 0) - Number((b as any).sort_order ?? 0)
    );
    const primary = sortedImages[0];

    // Hitung terjual
    return {
      id: (p as any).id,
      name: (p as any).name,
      slug: (p as any).slug,
      short_description: (p as any).short_description,
      brand: (p as any).brand,
      category: (p as any).category,
      sku: (p as any).sku,
      status: (p as any).status,
      base_price: (p as any).base_price,
      sale_price: (p as any).sale_price,
      is_featured: (p as any).is_featured,
      has_variants: (p as any).has_variants,
      stock,
      min_price: minPrice,
      max_price: maxPrice,
      image_url: (primary as Record<string, unknown>)?.image_url ?? null,
      variant_count: variants.length,
      updated_at: (p as any).updated_at,
      created_at: (p as any).created_at,
    };
  });

  return NextResponse.json(
    {
      products: enriched,
      total: count,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count ?? 0) / perPage),
    },
    { headers: { "content-type": "application/json" } }
  );
}

// POST /api/admin/products — buat produk baru
export async function POST(request: NextRequest) {
  const admin = await getAdminContext();
  if (isResponse(admin)) return admin;
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const input = body as Record<string, unknown>;

    const productInput = {
      name: typeof input.name === "string" ? input.name : "",
      slug: typeof input.slug === "string" ? input.slug : undefined,
      short_description: typeof input.short_description === "string" ? input.short_description : null,
      description: typeof input.description === "string" ? input.description : null,
      category: typeof input.category === "string" ? input.category || null : null,
      subcategory: typeof input.subcategory === "string" ? input.subcategory || null : null,
      brand: typeof input.brand === "string" ? input.brand || null : null,
      condition: (["new", "used", "refurbished"] as const).includes(input.condition as import("@/lib/types").ProductCondition)
        ? (input.condition as import("@/lib/types").ProductCondition)
        : ("new" as const),
      status: (["draft", "active", "inactive", "archived"] as const).includes(input.status as import("@/lib/types").ProductStatus)
        ? (input.status as import("@/lib/types").ProductStatus)
        : ("draft" as const),
      base_price: typeof input.base_price === "number" ? input.base_price : null,
      sale_price: typeof input.sale_price === "number" ? input.sale_price : null,
      sku: typeof input.sku === "string" ? input.sku || null : null,
      weight: typeof input.weight === "number" ? input.weight : null,
      length: typeof input.length === "number" ? input.length : null,
      width: typeof input.width === "number" ? input.width : null,
      height: typeof input.height === "number" ? input.height : null,
      has_variants: input.has_variants === true,
      is_featured: input.is_featured === true,
      is_new: input.is_new === true,
      min_purchase: typeof input.min_purchase === "number" && input.min_purchase >= 1 ? input.min_purchase : 1,
      max_purchase: typeof input.max_purchase === "number" && input.max_purchase >= 1 ? input.max_purchase : 99,
      tags: Array.isArray(input.tags) ? input.tags : [],
      seo_title: typeof input.seo_title === "string" ? input.seo_title || null : null,
      seo_description: typeof input.seo_description === "string" ? input.seo_description || null : null,
      seo_image_url: typeof input.seo_image_url === "string" ? input.seo_image_url || null : null,
      is_preorder: input.is_preorder === true,
      preorder_processing_days: typeof input.preorder_processing_days === "number" ? input.preorder_processing_days : null,
      admin_notes: typeof input.admin_notes === "string" ? input.admin_notes || null : null,
    };

    // Validasi
    const prodValidation = validateProductInput(productInput);
    if (!prodValidation.valid) {
      return NextResponse.json({ error: "Validasi produk gagal", errors: prodValidation.errors }, { status: 400 });
    }

    // Validasi varian jika ada
    const rawVariants = input.variants as Array<Record<string, unknown>> | undefined;
    let variantValidation = { valid: true, errors: {} } as ReturnType<typeof validateVariants>;
    if (rawVariants && rawVariants.length > 0) {
      variantValidation = validateVariants(rawVariants as any);
    }

    // Buat slug unik
    if (!productInput.slug) {
      productInput.slug = generateUniqueSlug(productInput.name);
    }

    // Cek slug unik
    const slugAvailable = await isSlugAvailable(productInput.slug!);
    if (!slugAvailable) {
      const altSlug = generateUniqueSlug(productInput.name);
      if (!await isSlugAvailable(altSlug)) {
        return NextResponse.json({ error: "Slug tidak tersedia" }, { status: 409 });
      }
      productInput.slug = altSlug;
    }

    const effectivePrice = pickEffectivePrice({
      base_price: productInput.base_price,
      sale_price: productInput.sale_price,
    });

    // Insert produk dalam transaksi (via RPC atau manual)
    const { data: product, error: prodError } = await supabaseAdmin
      .from("products")
      .insert({
        name: productInput.name!,
        slug: productInput.slug!,
        short_description: productInput.short_description,
        description: productInput.description,
        category: productInput.category,
        subcategory: productInput.subcategory,
        brand: productInput.brand,
        condition: productInput.condition,
        status: productInput.status,
        base_price: productInput.base_price,
        sale_price: productInput.sale_price,
        price: effectivePrice, // field legacy — tetap sinkron
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
        is_active: (productInput.status as string) === "active",
      })
      .select()
      .single();

    if (prodError || !product) {
      console.error("[API /api/admin/products] CREATE product error:", prodError?.message);
      return NextResponse.json({ error: "Gagal membuat produk", details: prodError?.message }, { status: 500 });
    }

    // Insert varian jika ada
    if (rawVariants && rawVariants.length > 0) {
      if (!variantValidation.valid) {
        // Rollback produk
        await supabaseAdmin.from("products").delete().eq("id", product.id);
        return NextResponse.json(
          { error: "Validasi varian gagal", errors: variantValidation.errors },
          { status: 400 }
        );
      }

      // Normalisasi varian: sync legacy fields
      const normalizedVariants = (rawVariants as Array<Record<string, unknown>>).map((v: Record<string, unknown>) => {
        const opt1Val = (v.option_1_value as string | null) || null;
        const opt2Val = (v.option_2_value as string | null) || null;
        return {
          product_id: product.id,
          option_1_name: (v.option_1_name || "Color").toString(),
          option_1_value: opt1Val,
          option_2_name: (v.option_2_name || "Size").toString(),
          option_2_value: opt2Val,
          sku: typeof v.sku === "string" ? v.sku : null,
          price: typeof v.price === "number" ? v.price : null,
          sale_price: typeof v.sale_price === "number" ? v.sale_price : null,
          stock: typeof v.stock === "number" && v.stock >= 0 ? v.stock : 0,
          image_url: typeof v.image_url === "string" ? v.image_url || null : null,
          is_active: v.is_active !== false,
          sort_order: typeof v.sort_order === "number" ? v.sort_order : 0,
          weight: typeof v.weight === "number" ? v.weight : null,
          // Legacy — fallback non-null agar tidak gagal di kolom NOT NULL
          color: opt1Val || "Default",
          size: opt2Val || "Default",
        };
      });

      const { error: varError } = await supabaseAdmin
        .from("product_variants")
        .insert(normalizedVariants);

      if (varError) {
        console.error("[API /api/admin/products] CREATE variants error:", varError.message);
        await supabaseAdmin.from("products").delete().eq("id", product.id);
        return NextResponse.json({ error: "Gagal membuat varian", details: varError.message }, { status: 500 });
      }

      // Sync product totals from variants.
      const { data: allVars } = await supabaseAdmin
        .from("product_variants")
        .select("stock, price, sale_price")
        .eq("product_id", product.id);
      const totalStock = ((allVars ?? []) as any[]).reduce((s, v) => s + (v.stock || 0), 0);
      const minPrice = (allVars ?? []).length
        ? Math.min(...(allVars as any[]).map((v) => v.sale_price != null ? v.sale_price : (v.price || 0)))
        : (productInput.base_price ?? 0);
      await supabaseAdmin
        .from("products")
        .update({ stock: totalStock, base_price: minPrice })
        .eq("id", product.id);
    }

    await logAdminAction({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "product.created",
      entity: "product",
      entityId: product.id,
      after: { name: productInput.name, status: productInput.status, variants: rawVariants?.length ?? 0 },
    });

    return NextResponse.json(
      {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          status: product.status,
        },
      },
      { status: 201, headers: { "content-type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[API /api/admin/products] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
