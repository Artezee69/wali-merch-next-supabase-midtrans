import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { getAdminContext, isResponse } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// POST /api/admin/products/attach-images
// Body: { product_id, image_ids: string[], sort_orders?: number[] }
// image_ids: daftar ID gambar dalam urutan yang diinginkan (index = sort_order)
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
    const { error: attachErr } = await supabaseAdmin
      .from("product_images")
      .update({ product_id: productId })
      .in("id", imageIds)
      .is("product_id", null);

    if (attachErr) {
      console.error("[API /api/admin/products/attach-images] attach error:", attachErr.message);
      return NextResponse.json({ error: "Gagal attach gambar" }, { status: 500 });
    }

    // Sync sort_order berdasarkan urutan image_ids (index = sort_order)
    // Foto pertama (index 0) = utama
    for (let i = 0; i < imageIds.length; i++) {
      const { error: updateErr } = await supabaseAdmin
        .from("product_images")
        .update({ sort_order: i, is_primary: i === 0 })
        .eq("id", imageIds[i])
        .eq("product_id", productId);

      if (updateErr) {
        console.error("[API /api/admin/products/attach-images] sort_order sync error:", updateErr.message);
        return NextResponse.json(
          { error: "Gagal menyimpan urutan foto", details: updateErr.message },
          { status: 500 }
        );
      }
    }

    // Hapus gambar lama yang tidak ada di daftar baru (yang tidak pernah dipesan)
    const { data: oldImages } = await supabaseAdmin
      .from("product_images")
      .select("id")
      .eq("product_id", productId)
      .not("id", "in", imageIds);

    if (oldImages) {
      for (const oi of oldImages as { id: string }[]) {
        await supabaseAdmin.from("product_images").delete().eq("id", oi.id);
      }
    }

    return NextResponse.json({ success: true, attached: imageIds.length });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
