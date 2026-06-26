import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { getAdminContext, isResponse } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logAdminAction } from "@/lib/adminAudit";

// POST /api/admin/products/upload-image
// Form: file (image), product_id
export async function POST(request: NextRequest) {
  const admin = await getAdminContext();
  if (isResponse(admin)) return admin;
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    // Accept both "productId" (from client) and "product_id" (legacy form name).
    const productId = (formData.get("productId") ?? formData.get("product_id")) as string | null;

    if (!file || !file.size || file.size === 0) {
      return NextResponse.json({ error: "File gambar wajib dikirim." }, { status: 400 });
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: `Ukuran file maksimal 5MB.` },
        { status: 400 }
      );
    }

    const allowedMime = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedMime.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF." },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const baseName = productId || crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const fileName = `${baseName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const storagePath = `products/${fileName}`;

    // Upload ke storage
    const buf = await file.arrayBuffer();
    const fileBody = new Uint8Array(buf);

    const { error: uploadErr } = await supabaseAdmin.storage
      .from("product-images")
      .upload(storagePath, fileBody, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      console.error("[API /api/admin/products/upload-image] storage upload error:", uploadErr.message);
      return NextResponse.json(
        { error: "Gagal upload gambar." },
        { status: 500 }
      );
    }

    // Dapatkan public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("product-images")
      .getPublicUrl(storagePath);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      console.error("[API /api/admin/products/upload-image] cannot get public URL");
      return NextResponse.json(
        { error: "Gagal mendapatkan URL gambar." },
        { status: 500 }
      );
    }

    // Dapatkan max sort_order jika productId ada
    let sortOrder = 0;
    if (productId) {
      const { data: maxRow } = await supabaseAdmin
        .from("product_images")
        .select("sort_order")
        .eq("product_id", productId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      sortOrder = (maxRow as { sort_order: number } | null)?.sort_order ?? -1;
      sortOrder += 1;
    }

    // Simpan metadata
    const { data: imgRow, error: metaErr } = await supabaseAdmin
      .from("product_images")
      .insert({
        product_id: productId || null,
        image_url: publicUrl,
        storage_path: storagePath,
        sort_order: sortOrder,
        is_primary: false,
      })
      .select()
      .single();

    if (metaErr) {
      console.error("[API /api/admin/products/upload-image] metadata insert error:", metaErr.message);
      // Gambar ter-upload tapi metadata gagal — rollback storage
      await supabaseAdmin.storage
        .from("product-images")
        .remove([storagePath]);
      return NextResponse.json(
        { error: "Gagal menyimpan metadata gambar." },
        { status: 500 }
      );
    }

    if (productId) {
      await logAdminAction({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "product.updated",
        entity: "product",
        entityId: productId,
        metadata: { image_uploaded: true, image_id: imgRow?.id, storage_path: storagePath },
      });
    }

    return NextResponse.json(
      {
        success: true,
        image: {
          id: imgRow?.id,
          image_url: publicUrl,
          storage_path: storagePath,
          sort_order: sortOrder,
        },
      },
      { status: 201, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("[API /api/admin/products/upload-image] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
