import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logAdminAction } from "@/lib/adminAudit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type NewVariant = {
  id?: string;
  option_1_name: string | null;
  option_1_value: string | null;
  option_2_name: string | null;
  option_2_value: string | null;
  price: number;
  sale_price: number | null;
  stock: number;
  sku?: string | null;
  image_url?: string | null;
  is_active: boolean;
};

type PutBody = {
  productId: string;
  variants: NewVariant[];
};

const MAX_VARIANTS = 200;

function bad(msg: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: msg, ...(extra ?? {}) }, { status });
}

function normalizePair(
  v: NewVariant,
): { opt1: string; opt2: string } {
  const opt1 = (v.option_1_value ?? "").trim();
  const opt2 = (v.option_2_value ?? "").trim();
  return { opt1, opt2 };
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) return bad("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const productId = (searchParams.get("productId") ?? "").trim();
    if (!productId) return bad("productId wajib diisi.");

    const { data, error } = await supabaseAdmin
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: true });

    if (error) return bad(error.message, 500);

    return NextResponse.json({ variants: data ?? [] });
  } catch (e: any) {
    console.error("GET variants error:", e);
    return bad(e?.message ?? "Internal error", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) return bad("Unauthorized", 401);

    let body: PutBody;
    try {
      body = (await req.json()) as PutBody;
    } catch {
      return bad("Body tidak valid (JSON).");
    }

    if (!body || typeof body !== "object")
      return bad("Body tidak valid.");
    const { productId, variants } = body;

    if (!productId || typeof productId !== "string")
      return bad("productId wajib diisi.");
    if (!Array.isArray(variants))
      return bad("variants harus array.");
    if (variants.length > MAX_VARIANTS)
      return bad(`Maksimal ${MAX_VARIANTS} variasi.`);

    // Verify product exists.
    const { data: product, error: productErr } = await supabaseAdmin
      .from("products")
      .select("id, has_variants, name, base_price, sale_price")
      .eq("id", productId)
      .maybeSingle();
    if (productErr) return bad(productErr.message, 500);
    if (!product) return bad("Produk tidak ditemukan.", 404);

    // Validate every row.
    const seenPairs = new Set<string>();
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v || typeof v !== "object")
        return bad(`Variasi #${i + 1} tidak valid.`);

      const opt1 = (v.option_1_value ?? "").toString().trim();
      const opt2 = (v.option_2_value ?? "").toString().trim();
      if (!opt1 && !opt2)
        return bad(`Variasi #${i + 1} minimal harus punya satu nilai opsi.`);
      const priceNum = Number(v.price);
      const stockNum = Number(v.stock);
      if (v.price == null || Number.isNaN(priceNum) || priceNum < 0)
        return bad(`Variasi #${i + 1}: harga tidak valid.`);
      if (v.stock == null || Number.isNaN(stockNum) || stockNum < 0)
        return bad(`Variasi #${i + 1}: stok tidak valid.`);
      if (
        v.sale_price != null &&
        (Number.isNaN(Number(v.sale_price)) || Number(v.sale_price) < 0)
      )
        return bad(`Variasi #${i + 1}: harga diskon tidak valid.`);
      if (
        v.sale_price != null &&
        Number(v.sale_price) >= priceNum
      )
        return bad(
          `Variasi #${i + 1}: harga diskon harus lebih kecil dari harga normal.`,
        );

      const key = `${opt1}::${opt2}`;
      if (seenPairs.has(key))
        return bad(`Variasi #${i + 1}: kombinasi opsi duplikat.`);
      seenPairs.add(key);
    }

    // Fetch existing variants for this product to compute diffs.
    const { data: existing, error: existErr } = await supabaseAdmin
      .from("product_variants")
      .select("id, sku, price, sale_price, stock, is_active")
      .eq("product_id", productId);
    if (existErr) return bad(existErr.message, 500);

    const existingIds = new Set((existing ?? []).map((e) => e.id));
    const incomingIds = new Set(
      variants.map((v) => v.id).filter((x): x is string => !!x),
    );

    // Check if any variant being deleted is referenced in an order.
    const idsToDelete = Array.from(existingIds).filter(
      (id) => !incomingIds.has(id),
    );
    if (idsToDelete.length > 0) {
      const { data: orderRefs, error: orderErr } = await supabaseAdmin
        .from("order_items")
        .select("variant_id")
        .in("variant_id", idsToDelete)
        .limit(1);
      if (orderErr) return bad(orderErr.message, 500);

      if ((orderRefs ?? []).length > 0) {
        // Don't hard-delete variants that are referenced in orders.
        // Soft-delete by setting is_active=false.
        const { error: softErr } = await supabaseAdmin
          .from("product_variants")
          .update({ is_active: false, stock: 0 })
          .in("id", idsToDelete);
        if (softErr) return bad(softErr.message, 500);
      } else {
        const { error: delErr } = await supabaseAdmin
          .from("product_variants")
          .delete()
          .in("id", idsToDelete);
        if (delErr) return bad(delErr.message, 500);
      }
    }

    // Upsert incoming rows.
    let updatedCount = 0;
    let createdCount = 0;
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const opt1 = (v.option_1_value ?? "").toString().trim();
      const opt2 = (v.option_2_value ?? "").toString().trim();
      const on1Raw = (v.option_1_name ?? "").toString().trim();
      const on2Raw = (v.option_2_name ?? "").toString().trim();
      const on1 = on1Raw || "Opsi 1";
      const on2 = on2Raw || (opt2 ? "Opsi 2" : null);

      // Legacy compat: synthesize size/color from new format.
      const legacySize = (opt2 ? opt2 : opt1) || "Default";
      const legacyColor = opt2 ? opt1 : null;

      const row = {
        product_id: productId,
        option_1_name: on1,
        option_1_value: opt1 || null,
        option_2_name: on2,
        option_2_value: opt2 || null,
        price: Number(v.price),
        sale_price:
          v.sale_price == null || Number.isNaN(Number(v.sale_price))
            ? null
            : Number(v.sale_price),
        stock: Number(v.stock),
        sku: v.sku?.trim() || null,
        image_url: v.image_url?.trim() || null,
        is_active: v.is_active !== false,
        // Legacy columns — keep them in sync for customer catalog.
        size: legacySize,
        color: legacyColor,
        updated_at: new Date().toISOString(),
      };

      if (v.id && existingIds.has(v.id)) {
        const { error } = await supabaseAdmin
          .from("product_variants")
          .update(row)
          .eq("id", v.id);
        if (error) return bad(error.message, 500);
        updatedCount++;
      } else {
        const { error } = await supabaseAdmin
          .from("product_variants")
          .insert(row);
        if (error) return bad(error.message, 500);
        createdCount++;
      }
    }

    // Recompute product's total stock from active variants.
    const { data: allVariants, error: fetchErr } = await supabaseAdmin
      .from("product_variants")
      .select("stock, is_active, price, sale_price")
      .eq("product_id", productId);
    if (fetchErr) return bad(fetchErr.message, 500);

    const active = (allVariants ?? []).filter((x) => x.is_active !== false);
    const totalStock = active.reduce((s, v) => s + Number(v.stock || 0), 0);
    const minPrice = active.length
      ? Math.min(
          ...active.map((v) =>
            v.sale_price != null ? Number(v.sale_price) : Number(v.price),
          ),
        )
      : (product.base_price ?? 0);

    const { error: prodUpdateErr } = await supabaseAdmin
      .from("products")
      .update({
        has_variants: variants.length > 0,
        stock: totalStock,
        base_price: minPrice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);
    if (prodUpdateErr) return bad(prodUpdateErr.message, 500);

    await logAdminAction({
      actorId: session.userId,
      actorEmail: session.email,
      action: "product.variants_updated",
      entity: "product",
      entityId: productId,
      metadata: {
        incoming: variants.length,
        created: createdCount,
        updated: updatedCount,
        removed: idsToDelete.length,
      },
    });

    return NextResponse.json({
      ok: true,
      total: variants.length,
      created: createdCount,
      updated: updatedCount,
      removed: idsToDelete.length,
      stock: totalStock,
    });
  } catch (e: any) {
    console.error("PUT variants error:", e);
    return bad(e?.message ?? "Internal error", 500);
  }
}

export async function POST(req: NextRequest) {
  // Bulk helper: apply the same field to all variants of a product.
  try {
    const session = await requireAdmin();
    if (!session) return bad("Unauthorized", 401);

    let body: {
      productId: string;
      ids?: string[];
      field: "price" | "stock" | "is_active" | "sale_price";
      mode: "set" | "increment";
      value: number | boolean;
    };
    try {
      body = await req.json();
    } catch {
      return bad("Body tidak valid (JSON).");
    }
    if (!body?.productId) return bad("productId wajib diisi.");
    const field = body.field;
    if (!["price", "stock", "is_active", "sale_price"].includes(field))
      return bad("Field tidak valid.");

    let query = supabaseAdmin
      .from("product_variants")
      .select("id, stock, price, sale_price")
      .eq("product_id", body.productId);
    if (Array.isArray(body.ids) && body.ids.length > 0)
      query = query.in("id", body.ids);
    const { data: rows, error } = await query;
    if (error) return bad(error.message, 500);
    if (!rows || rows.length === 0)
      return NextResponse.json({ ok: true, updated: 0 });

    let updated = 0;
    for (const r of rows) {
      let newVal: number | boolean = r[field as "price" | "stock"];
      if (field === "is_active") {
        newVal = Boolean(body.value);
      } else {
        const num = Number(body.value);
        if (Number.isNaN(num)) return bad("Value tidak valid.");
        if (field === "stock") {
          newVal = body.mode === "increment"
            ? Math.max(0, Number(r.stock) + num)
            : Math.max(0, num);
        } else if (field === "price") {
          newVal = body.mode === "increment"
            ? Math.max(0, Number(r.price) + num)
            : Math.max(0, num);
        } else if (field === "sale_price") {
          if (body.mode === "increment") {
            const cur = r.sale_price == null ? Number(r.price) : Number(r.sale_price);
            newVal = Math.max(0, cur + num);
          } else {
            newVal = Math.max(0, num);
          }
        }
      }
      const { error: u } = await supabaseAdmin
        .from("product_variants")
        .update({
          [field]: newVal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", r.id);
      if (u) return bad(u.message, 500);
      updated++;
    }

    // Recompute product totals.
    const { data: all } = await supabaseAdmin
      .from("product_variants")
      .select("stock, is_active, price, sale_price")
      .eq("product_id", body.productId);
    const active = (all ?? []).filter((x) => x.is_active !== false);
    const totalStock = active.reduce((s, v) => s + Number(v.stock || 0), 0);
    const minPrice = active.length
      ? Math.min(
          ...active.map((v) =>
            v.sale_price != null ? Number(v.sale_price) : Number(v.price),
          ),
        )
      : 0;
    await supabaseAdmin
      .from("products")
      .update({
        stock: totalStock,
        base_price: minPrice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.productId);

    await logAdminAction({
      actorId: session.userId,
      actorEmail: session.email,
      action: "product.variants_bulk_update",
      entity: "product",
      entityId: body.productId,
      metadata: { field, mode: body.mode, value: body.value, count: updated },
    });

    return NextResponse.json({ ok: true, updated });
  } catch (e: any) {
    console.error("POST variants bulk error:", e);
    return bad(e?.message ?? "Internal error", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) return bad("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const variantId = (searchParams.get("id") ?? "").trim();
    if (!variantId) return bad("id wajib diisi.");

    // Don't hard-delete if used in any order.
    const { data: orderRef, error: refErr } = await supabaseAdmin
      .from("order_items")
      .select("id")
      .eq("variant_id", variantId)
      .limit(1);
    if (refErr) return bad(refErr.message, 500);

    if ((orderRef ?? []).length > 0) {
      const { error } = await supabaseAdmin
        .from("product_variants")
        .update({ is_active: false, stock: 0 })
        .eq("id", variantId);
      if (error) return bad(error.message, 500);
      return NextResponse.json({ ok: true, mode: "soft" });
    }

    const { error } = await supabaseAdmin
      .from("product_variants")
      .delete()
      .eq("id", variantId);
    if (error) return bad(error.message, 500);
    return NextResponse.json({ ok: true, mode: "hard" });
  } catch (e: any) {
    console.error("DELETE variant error:", e);
    return bad(e?.message ?? "Internal error", 500);
  }
}
