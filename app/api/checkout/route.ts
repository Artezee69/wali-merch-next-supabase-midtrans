import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import midtransClient from "midtrans-client";

function generateOrderCode() {
  const now = new Date();

  const date = now
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const random = Math.floor(1000 + Math.random() * 9000);

  return `WALI-${date}-${random}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const customer = body.customer;
    const items = body.items || [];
    const shippingCost = Number(body.shipping_cost || 0);
    const shippingService = body.shipping_service || null;

    if (!customer) {
      return NextResponse.json(
        { error: "Data customer tidak ditemukan." },
        { status: 400 }
      );
    }

    if (!items.length) {
      return NextResponse.json(
        { error: "Cart masih kosong." },
        { status: 400 }
      );
    }

    if (!customer.customer_name || !customer.customer_phone || !customer.address) {
      return NextResponse.json(
        { error: "Nama, WhatsApp, dan alamat wajib diisi." },
        { status: 400 }
      );
    }

    const subtotal = items.reduce((total: number, item: any) => {
      return total + Number(item.price) * Number(item.quantity);
    }, 0);

    const totalAmount = subtotal + (Number.isFinite(shippingCost) ? shippingCost : 0);
    const orderCode = generateOrderCode();

    // Create Midtrans Snap Token first
    let snapToken = "";
    let redirectUrl = "";
    try {
      const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
      const snap = new midtransClient.Snap({
        isProduction,
        serverKey: process.env.MIDTRANS_SERVER_KEY || "",
        clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
      });

      const itemDetails = items.map((item: any) => ({
        id: `${item.productId}-${item.variantId}`,
        price: Number(item.price),
        quantity: Number(item.quantity),
        name: item.name,
      }));

      const grossAmount = totalAmount;

      const transactionDetails = {
        order_id: orderCode,
        gross_amount: grossAmount,
      };

      const customerDetails = {
        first_name: customer.customer_name,
        email: customer.customer_email || "",
        phone: customer.customer_phone,
        billing_address: {
          first_name: customer.customer_name,
          email: customer.customer_email || "",
          phone: customer.customer_phone,
          address: customer.address,
          city: customer.city || "",
          postal_code: customer.postal_code || "",
          country_code: "IDN",
        },
        shipping_address: {
          first_name: customer.customer_name,
          email: customer.customer_email || "",
          phone: customer.customer_phone,
          address: customer.address,
          city: customer.city || "",
          postal_code: customer.postal_code || "",
          country_code: "IDN",
        },
      };

      const transaction = await snap.createTransaction({
        transaction_details: transactionDetails,
        item_details: itemDetails,
        customer_details: customerDetails,
      });

      snapToken = transaction.token;
      redirectUrl = transaction.redirect_url;
    } catch (midtransError: any) {
      console.error("MIDTRANS SNAP ERROR:", midtransError);
      return NextResponse.json(
        { error: `Gagal membuat pembayaran: ${midtransError.message || "Midtrans error"}` },
        { status: 500 }
      );
    }

    // Build the order payload. New columns (subtotal, shipping_cost,
    // shipping_service) require the 001_add_shipping_fields.sql migration.
    // If the columns don't exist yet (e.g. before migration runs), the first
    // insert will fail with "Could not find the column ... in schema cache" —
    // we fall back to a minimal payload so checkout doesn't break.
    const fullPayload = {
      order_code: orderCode,
      customer_name: customer.customer_name,
      customer_email: customer.customer_email || null,
      customer_phone: customer.customer_phone,
      address: customer.address,
      province: customer.province || null,
      city: customer.city || null,
      district: customer.district || null,
      postal_code: customer.postal_code || null,
      notes: customer.notes || null,
      subtotal,
      shipping_cost: Number.isFinite(shippingCost) ? shippingCost : 0,
      shipping_service: shippingService,
      total_amount: totalAmount,
      payment_status: "pending",
      order_status: "waiting_payment",
    };

    const minimalPayload = {
      order_code: orderCode,
      customer_name: customer.customer_name,
      customer_email: customer.customer_email || null,
      customer_phone: customer.customer_phone,
      address: customer.address,
      province: customer.province || null,
      city: customer.city || null,
      district: customer.district || null,
      postal_code: customer.postal_code || null,
      notes: customer.notes || null,
      total_amount: totalAmount,
      payment_status: "pending",
      order_status: "waiting_payment",
    };

    let order: any = null;
    let orderError: any = null;

    const firstAttempt = await supabaseAdmin
      .from("orders")
      .insert(fullPayload)
      .select()
      .single();

    if (firstAttempt.error && /column .* does not exist|Could not find the .* column/i.test(firstAttempt.error.message)) {
      console.warn("Shipping columns missing — falling back to minimal payload. Run supabase/migrations/001_add_shipping_fields.sql");
      const fallback = await supabaseAdmin
        .from("orders")
        .insert(minimalPayload)
        .select()
        .single();
      order = fallback.data;
      orderError = fallback.error;
    } else {
      order = firstAttempt.data;
      orderError = firstAttempt.error;
    }

    if (orderError) {
      console.error("CREATE ORDER ERROR:", orderError);
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      );
    }

    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId,
      product_name: item.name,
      size: item.size,
      price: Number(item.price),
      quantity: Number(item.quantity),
      subtotal: Number(item.price) * Number(item.quantity),
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("CREATE ORDER ITEMS ERROR:", itemsError);

      await supabaseAdmin.from("orders").delete().eq("id", order.id);

      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_code: order.order_code,
      snap_token: order.midtrans_token,
      redirect_url: order.midtrans_redirect_url,
    });
  } catch (error: any) {
    console.error("CHECKOUT API ERROR:", error);

    return NextResponse.json(
      { error: error.message || "Checkout error." },
      { status: 500 }
    );
  }
}