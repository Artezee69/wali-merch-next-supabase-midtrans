import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const productId = url.searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id param required" });

  const { data: variants, error } = await supabaseAdmin
    .from("product_variants")
    .select("*")
    .eq("product_id", productId);

  if (error) {
    return NextResponse.json({ status: "ERROR", error: error.message });
  }

  // Also check which columns exist on product_variants
  const { data: sampleVariant, error: sampleErr } = await supabaseAdmin
    .from("product_variants")
    .select("*")
    .limit(1);

  const columns = sampleVariant?.length ? Object.keys(sampleVariant[0]) : null;

  return NextResponse.json({
    status: "OK",
    variant_count: variants?.length ?? 0,
    variants: variants,
    columns,
  });
}
