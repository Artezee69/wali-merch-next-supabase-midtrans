import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { getAdminContext, isResponse } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// PATCH /api/admin/products/images/[imageId] — ubah urutan/primary
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const admin = await getAdminContext();
  if (isResponse(admin)) return admin;
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageId } = await params;

  try {
    const body = await request.json();
    const update: Record<string, unknown> = {};

    if (typeof body.sort_order === "number") {
      update.sort_order = body.sort_order;
    }
    if (typeof body.is_primary === "boolean") {
      update.is_primary = body.is_primary;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Tidak ada data untuk diupdate" }, { status: 400 });
    }

    // Jika set primary, hapus primary lain dari produk yang sama
    if (update.is_primary === true) {
      const { data: img } = await supabaseAdmin
        .from("product_images")
        .select("product_id")
        .eq("id", imageId)
        .maybeSingle();

      const pid = (img as { product_id: string } | null)?.product_id;
      if (pid) {
        await supabaseAdmin
          .from("product_images")
          .update({ is_primary: false })
          .eq("product_id", pid)
          .neq("id", imageId);
      }
    }

    const { error } = await supabaseAdmin
      .from("product_images")
      .update(update)
      .eq("id", imageId);

    if (error) {
      console.error("[API /api/admin/products/images/:id] PATCH error:", error.message);
      return NextResponse.json({ error: "Gagal memperbarui gambar" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/products/images/[imageId] — hapus gambar dan file storage
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const admin = await getAdminContext();
  if (isResponse(admin)) return admin;
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageId } = await params;

  // Ambil row gambar
  const { data: img, error: fetchErr } = await supabaseAdmin
    .from("product_images")
    .select("storage_path, image_url")
    .eq("id", imageId)
    .maybeSingle();

  if (fetchErr || !img) {
    return NextResponse.json({ error: "Gambar tidak ditemukan" }, { status: 404 });
  }

  const storagePath = (img as { storage_path: string | null }).storage_path;

  // Hapus dari storage (non-blocking, hanya log)
  if (storagePath) {
    const { error: rmErr } = await supabaseAdmin.storage
      .from("product-images")
      .remove([storagePath]);
    if (rmErr) {
      console.error("[API /api/admin/products/images/:id] storage delete error:", rmErr.message);
    }
  }

  // Hapus row
  const { error: deleteErr } = await supabaseAdmin
    .from("product_images")
    .delete()
    .eq("id", imageId);

  if (deleteErr) {
    console.error("[API /api/admin/products/images/:id] row delete error:", deleteErr.message);
    return NextResponse.json({ error: "Gagal menghapus gambar" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
