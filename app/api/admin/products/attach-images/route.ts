import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { getAdminContext, isResponse } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// POST /api/admin/products/attach-images
// Body: { product_id, image_ids: string[] }
// Attach gambar yang diupload sebelum produk dibuat (image_id dengan product_id = null)
export async function POST(request: NextRequest) {
  const admin = await getAdminContext();
  if (isResponse(admin)) return admin;
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const productId = body.product_id as string | undefined;
    const imageIds = body.image_ids as string[] | undefined;

    if (!productId || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { error: "product_id dan image_ids wajib diisi" },
        { status: 400 }
      );
    }

    // Pastikan produk ada
    const { data: prod } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();

    if (!prod) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    // Update gambar — set product_id
    const { error } = await supabaseAdmin
      .from("product_images")
      .update({ product_id: productId })
      .in("id", imageIds)
      .is("product_id", null);

    if (error) {
      console.error("[API /api/admin/products/attach-images] error:", error.message);
      return NextResponse.json({ error: "Gagal attach gambar" }, { status: 500 });
    }

    return NextResponse.json({ success: true, attached: imageIds.length });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
