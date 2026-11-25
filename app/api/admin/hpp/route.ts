import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { getAdminContext, isResponse } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { pickEffectivePrice } from "@/lib/productHelpers";
import { logAdminAction } from "@/lib/adminAudit";

/* ================= Types ================= */

export type HppItemInput = {
  id: string;
  name: string;
  amount: number;
  qty?: number | null;
};

export type OverheadItemInput = {
  id: string;
  name: string;
  amount: number;
};

export type HppPayload = {
  hpp_items: HppItemInput[];
  overhead_items: OverheadItemInput[];
  sales_fee: number;
  kantor_share: number;
  studio_share: number;
  notes?: string | null;
};

export type HppProductRow = {
  id: string;
  name: string;
  base_price: number | null;
  sale_price: number | null;
  price: number | null;
  status: string;
  has_variants: boolean;
  hpp_items: HppItemInput[];
  overhead_items: OverheadItemInput[];
  sales_fee: number;
  kantor_share: number;
  studio_share: number;
  notes: string | null;
  updated_at: string | null;
};

function sanitizeItem<T extends { id?: unknown; name?: unknown; amount?: unknown; qty?: unknown }>(
  raw: T
): { id: string; name: string; amount: number; qty?: number | null } {
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const amount = Math.max(0, Math.round(Number(raw.amount) || 0));
  const qty =
    raw.qty != null && raw.qty !== "" && Number.isFinite(Number(raw.qty))
      ? Math.max(1, Math.round(Number(raw.qty)))
      : null;
  const id =
    typeof raw.id === "string" && raw.id.trim() !== ""
      ? raw.id.trim()
      : `i${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return qty != null ? { id, name, amount, qty } : { id, name, amount };
}

/* ================= GET ================= */

// GET /api/admin/hpp
// Daftar produk (nama + harga jual efektif) + HPP yang sudah tersimpan.
export async function GET(request: NextRequest) {
  const admin = await getAdminContext();
  if (isResponse(admin)) return admin;
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const perPage = Math.min(100, Math.max(1, Number(searchParams.get("per_page") || 50)));
  const page = Math.max(1, Number(searchParams.get("page") || 1));

  // Semua produk; nama & harga jual diambil langsung dari tabel products
  // supaya selalu sesuai dengan data live di database.
  let query = supabaseAdmin.from("products").select(
    "id, name, status, has_variants, price, base_price, sale_price, updated_at"
  );

  if (q) {
    query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
  }

  const { data: productsRaw, error: prodError } = await query;
  if (prodError) {
    console.error("[API /api/admin/hpp] GET products error:", prodError.message);
    return NextResponse.json(
      { error: "Gagal memuat produk", details: prodError.message },
      { status: 500 }
    );
  }

  const products = (productsRaw ?? []) as Array<
    Record<string, unknown>
  >;
  const productIds = products.map((p) => (p.id as string) ?? "");

  const { data: hppRows, error: hppError } = productIds.length
    ? await supabaseAdmin
        .from("product_hpp")
        .select("product_id, hpp_items, overhead_items, sales_fee, kantor_share, studio_share, notes, updated_at")
        .in("product_id", productIds)
    : { data: [] as any[], error: null };
  if (hppError) {
    console.error("[API /api/admin/hpp] GET hpp error:", hppError.message);
    return NextResponse.json(
      { error: "Gagal memuat data HPP", details: hppError.message },
      { status: 500 }
    );
  }

  const hppByProduct = new Map<string, Record<string, unknown>>();
  for (const row of (hppRows ?? []) as Array<Record<string, unknown>>) {
    hppByProduct.set(row.product_id as string, row);
  }

  const out = products.map((p) => {
    const hpp = hppByProduct.get(p.id as string);
    const effectivePrice = pickEffectivePrice({
      base_price: (p.base_price as number | null) ?? null,
      sale_price: (p.sale_price as number | null) ?? null,
    });
    const sale = p.sale_price as number | null;
    const fallback =
      (typeof p.price === "number" ? p.price : null) ??
      (typeof p.base_price === "number" ? p.base_price : null) ??
      0;
    const sellPrice = sale ?? effectivePrice ?? fallback;

    return {
      id: p.id,
      name: p.name,
      base_price: p.base_price,
      sale_price: p.sale_price,
      sell_price: sellPrice,
      status: p.status,
      has_variants: p.has_variants,
      hpp_items: (hpp?.hpp_items as HppItemInput[]) ?? [],
      overhead_items: (hpp?.overhead_items as OverheadItemInput[]) ?? [],
      sales_fee: (hpp?.sales_fee as number) ?? 10000,
      kantor_share: (hpp?.kantor_share as number) ?? 40,
      studio_share: (hpp?.studio_share as number) ?? 60,
      notes: (hpp?.notes as string | null) ?? null,
      updated_at: (hpp?.updated_at as string | null) ?? null,
    };
  });

  return NextResponse.json({
    products: out,
    total: products.length,
    page,
    per_page: perPage,
  });
}

/* ================= POST ================= */

// POST /api/admin/hpp — simpan (upsert) HPP untuk satu produk
export async function POST(request: NextRequest) {
  const admin = await getAdminContext();
  if (isResponse(admin)) return admin;
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const productId = typeof body.product_id === "string" ? body.product_id.trim() : "";
    if (!productId) {
      return NextResponse.json({ error: "product_id wajib diisi" }, { status: 400 });
    }

    // Pastikan produknya ada
    const { data: product, error: prodCheckErr } = await supabaseAdmin
      .from("products")
      .select("id, name, base_price, sale_price, status")
      .eq("id", productId)
      .maybeSingle();
    if (prodCheckErr || !product) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    const rawHppItems = Array.isArray(body.hpp_items) ? (body.hpp_items as any[]) : [];
    const rawOverheadItems = Array.isArray(body.overhead_items) ? (body.overhead_items as any[]) : [];

    const hpp_items = rawHppItems
      .map((i) => sanitizeItem(i))
      .filter((i) => i.name || i.amount > 0);
    const overhead_items = rawOverheadItems
      .map((i) => sanitizeItem(i))
      .filter((i) => i.name || i.amount > 0)
      .map((i) => ({ id: i.id, name: i.name, amount: i.amount }));

    const sales_fee = Math.max(0, Math.round(Number(body.sales_fee) || 0));
    let kantor_share = Math.round(Number(body.kantor_share));
    let studio_share = Math.round(Number(body.studio_share));
    if (!Number.isFinite(kantor_share) || kantor_share < 0 || kantor_share > 100) kantor_share = 40;
    if (!Number.isFinite(studio_share) || studio_share < 0 || studio_share > 100) studio_share = 60;
    const shareSum = kantor_share + studio_share;
    if (shareSum !== 100) {
      return NextResponse.json(
        {
          error: `Porsi kantor + studio harus total 100% (skarang ${shareSum}%).`,
        },
        { status: 400 }
      );
    }
    const notes =
      typeof body.notes === "string" && body.notes.trim() !== ""
        ? body.notes.trim()
        : null;

    const { data, error } = await supabaseAdmin
      .from("product_hpp")
      .upsert(
        {
          product_id: productId,
          hpp_items,
          overhead_items,
          sales_fee,
          kantor_share,
          studio_share,
          notes,
        },
        { onConflict: "product_id" }
      )
      .select()
      .single();

    if (error || !data) {
      console.error("[API /api/admin/hpp] upsert error:", error?.message);
      return NextResponse.json(
        { error: "Gagal menyimpan data HPP", details: error?.message },
        { status: 500 }
      );
    }

    await logAdminAction({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "product.updated",
      entity: "product_hpp",
      entityId: productId,
      after: {
        product_name: (product as any).name,
        sales_fee,
        kantor_share,
        studio_share,
        hpp_items_count: hpp_items.length,
        overhead_items_count: overhead_items.length,
      },
    });

    return NextResponse.json({
      success: true,
      product_id: productId,
      updated_at: data.updated_at,
    });
  } catch (err: unknown) {
    console.error("[API /api/admin/hpp] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
