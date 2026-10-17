import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const orderCode = formData.get("order_code") as string;
    const proofFile = formData.get("proof") as File | null;

    if (!orderCode) {
      return NextResponse.json(
        { error: "order_code tidak ditemukan." },
        { status: 400 }
      );
    }

    if (!proofFile || proofFile.size === 0) {
      return NextResponse.json(
        { error: "File bukti transfer tidak ditemukan." },
        { status: 400 }
      );
    }

    // Verify the order exists
    const supabaseAdmin = getSupabaseAdmin();
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, order_code")
      .eq("order_code", orderCode)
      .maybeSingle();

    if (orderError) {
      console.error("UPLOAD PROOF - ORDER LOOKUP ERROR:", orderError);
      return NextResponse.json(
        { error: "Order tidak ditemukan. Silakan cek kembali nomor order." },
        { status: 404 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order tidak ditemukan. Silakan cek kembali nomor order." },
        { status: 404 }
      );
    }

    // Upload file to Supabase Storage bucket "transfer-proofs"
    const fileExt = proofFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const allowedExts = ["jpg", "jpeg", "png", "webp", "heic"];
    if (!allowedExts.includes(fileExt)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Gunakan JPG, PNG, atau WEBP." },
        { status: 400 }
      );
    }

    const filePath = `${orderCode}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("transfer-proofs")
      .upload(filePath, proofFile, {
        contentType: proofFile.type || `image/${fileExt}`,
        upsert: false,
      });

    if (uploadError) {
      console.error("UPLOAD PROOF - STORAGE ERROR:", uploadError.message);
      // Don't silently succeed — the admin won't have anything to see.
      return NextResponse.json(
        {
          error:
            "Upload bukti transfer gagal (bucket storage belum tersedia). " +
            "Silakan hubungi admin via WhatsApp untuk mengirim bukti secara manual.",
        },
        { status: 500 }
      );
    }

    let proofUrl = "";
    {
      const { data: urlData } = supabaseAdmin.storage
        .from("transfer-proofs")
        .getPublicUrl(filePath);
      proofUrl = urlData?.publicUrl || "";
    }

    // Update the order with proof metadata. The transfer_proof_url and
    // transfer_proof_filename columns may not exist yet (migration 025
    // not applied). Wrap in try/catch and inspect the error message.
    try {
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          transfer_proof_url: proofUrl || null,
          transfer_proof_filename: filePath,
        })
        .eq("id", order.id);

      if (updateError) {
        if (/column .* does not exist|Could not find the .* column/i.test(updateError.message)) {
          console.warn("transfer_proof columns missing — migration 025 not applied. Proof metadata not saved.");
        } else {
          console.error("UPLOAD PROOF - ORDER UPDATE ERROR:", updateError);
          return NextResponse.json(
            { error: updateError.message },
            { status: 500 }
          );
        }
      }
    } catch (updateCatch) {
      console.error("UPLOAD PROOF - UPDATE EXCEPTION:", updateCatch);
    }

    return NextResponse.json({
      success: true,
      order_code: orderCode,
      transfer_proof_url: proofUrl || null,
    });
  } catch (error: any) {
    console.error("UPLOAD PROOF API ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Gagal upload bukti transfer." },
      { status: 500 }
    );
  }
}
