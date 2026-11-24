import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Diagnose: check if key columns exist on products table
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, name, base_price, sale_price, stock, status, is_active, price")
    .limit(1);

  if (error) {
    return NextResponse.json({
      status: "FAIL",
      error: error.message,
      hint: "Column(s) may not exist in products table. Try removing columns one by one.",
    });
  }

  const row = data?.[0];
  return NextResponse.json({
    status: "OK",
    row,
    columns_tested: ["id", "name", "base_price", "sale_price", "stock", "status", "is_active", "price"],
  });
}

export async function POST(req: NextRequest) {
  // Test: try to update a product's base_price + status
  const { product_id, base_price, status } = await req.json();
  if (!product_id) return NextResponse.json({ error: "product_id required" });

  const update: Record<string, unknown> = {};
  if (base_price !== undefined) update.base_price = Number(base_price) || 0;
  if (status) update.status = status;

  const { data, error } = await supabaseAdmin
    .from("products")
    .update(update)
    .eq("id", product_id)
    .select("id, base_price, status")
    .single();

  if (error) {
    return NextResponse.json({ status: "FAIL", error: error.message, payload: update });
  }
  return NextResponse.json({ status: "OK", data, payload: update });
}
