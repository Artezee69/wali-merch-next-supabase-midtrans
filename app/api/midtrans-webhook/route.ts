import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Fungsi validasi signature key Midtrans (SHA512)
function verifySignature(payload: any) {
  const raw = `${payload.order_id}${payload.status_code}${payload.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`;
  const signature = crypto.createHash("sha512").update(raw).digest("hex");
  return signature === payload.signature_key;
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Validasi signature key untuk security
    if (!verifySignature(payload)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const orderCode = payload.order_id;
    const transactionStatus = payload.transaction_status;
    const fraudStatus = payload.fraud_status;
    const paymentMethod = payload.payment_type;
    const paidAt = payload.transaction_time || new Date().toISOString();

    // Map transaction_status Midtrans ke internal status
    let payment_status = "pending";
    let order_status = "waiting_payment";

    if (transactionStatus === "capture") {
      if (fraudStatus === "accept") {
        payment_status = "paid";
        order_status = "processing";
      }
    } else if (transactionStatus === "settlement") {
      payment_status = "paid";
      order_status = "processing";
    } else if (["deny", "expire", "cancel"].includes(transactionStatus)) {
      payment_status = transactionStatus;
      order_status = "cancelled";
    }

    // Ambil order saat ini untuk idempotency & stock update
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, payment_status, order_status")
      .eq("order_code", orderCode)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotency: jangan update status ke backward (mis. dari processing ke waiting_payment)
    // Hanya update ke status yang lebih "maju"
    const statusOrder = ["waiting_payment", "pending", "paid", "processing", "cancelled", "failed"];
    const currentIdx = statusOrder.indexOf(order.order_status || "waiting_payment");
    const newIdx = statusOrder.indexOf(order_status);

    if (newIdx <= currentIdx) {
      // Status baru tidak lebih maju dari status saat ini → skip update
      return NextResponse.json({ ok: true, message: "Status already advanced" });
    }

    // Update order status
    await supabaseAdmin
      .from("orders")
      .update({
        payment_status,
        order_status,
        payment_method: paymentMethod,
        paid_at: paidAt,
      })
      .eq("id", order.id);

    // Dekremen stock hanya saat pertama kali bayar (paid + sebelumnya bukan paid)
    if (payment_status === "paid" && order.payment_status !== "paid") {
      const { data: items } = await supabaseAdmin
        .from("order_items")
        .select("variant_id, quantity")
        .eq("order_id", order.id);

      for (const item of items || []) {
        const { data: variant } = await supabaseAdmin
          .from("product_variants")
          .select("stock")
          .eq("id", item.variant_id)
          .single();

        const nextStock = Math.max(0, (variant?.stock || 0) - item.quantity);
        await supabaseAdmin
          .from("product_variants")
          .update({ stock: nextStock })
          .eq("id", item.variant_id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("MIDTRANS WEBHOOK ERROR:", error);
    return NextResponse.json({ error: error.message || "Webhook error" }, { status: 500 });
  }
}