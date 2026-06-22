import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function verifySignature(payload: any) {
  const raw = `${payload.order_id}${payload.status_code}${payload.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`;
  const signature = crypto.createHash("sha512").update(raw).digest("hex");
  return signature === payload.signature_key;
}

export async function POST(req: Request) {
  const payload = await req.json();
  if (!verifySignature(payload)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const orderCode = payload.order_id;
  const transactionStatus = payload.transaction_status;
  const fraudStatus = payload.fraud_status;

  let payment_status = "pending";
  let order_status = "waiting_payment";

  if (transactionStatus === "capture") {
    if (fraudStatus === "accept") { payment_status = "paid"; order_status = "paid"; }
  } else if (transactionStatus === "settlement") {
    payment_status = "paid"; order_status = "paid";
  } else if (["deny", "expire", "cancel"].includes(transactionStatus)) {
    payment_status = transactionStatus;
    order_status = "cancelled";
  }

  const { data: order } = await supabaseAdmin.from("orders").select("id, payment_status").eq("order_code", orderCode).single();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  await supabaseAdmin.from("orders").update({ payment_status, order_status }).eq("id", order.id);

  if (payment_status === "paid" && order.payment_status !== "paid") {
    const { data: items } = await supabaseAdmin.from("order_items").select("variant_id, quantity").eq("order_id", order.id);
    for (const item of items || []) {
      const { data: variant } = await supabaseAdmin.from("product_variants").select("stock").eq("id", item.variant_id).single();
      const nextStock = Math.max(0, (variant?.stock || 0) - item.quantity);
      await supabaseAdmin.from("product_variants").update({ stock: nextStock }).eq("id", item.variant_id);
    }
  }

  return NextResponse.json({ ok: true });
}
