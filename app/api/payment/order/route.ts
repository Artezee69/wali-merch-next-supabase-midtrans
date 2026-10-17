import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getStoreSettings } from "@/lib/storeSettings";

function generateOrderCode() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `WALI-${date}-${random}`;
}

/** Extract the logged-in user's ID from the Supabase auth cookie in the request. */
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) return null;

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!anonKey || !supabaseUrl) return null;

    const sb = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        flowType: "pkce",
        detectSessionInUrl: false,
      },
    });

    const cookie = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("sb-"));
    if (!cookie) return null;

    // Find the session token from the cookies — sb-<ref>-auth.token
    // We parse the raw JWT from the supabase auth cookie
    const sbAuthCookies = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .filter((c) => c.startsWith("sb-") && c.includes("-auth.token"));

    let accessToken: string | null = null;
    for (const sbCookie of sbAuthCookies) {
      const value = sbCookie.split("=").slice(1).join("=");
      if (value) {
        try {
          const decoded = JSON.parse(decodeURIComponent(value));
          if (decoded?.access_token) {
            accessToken = decoded.access_token;
            break;
          }
        } catch {
          // not JSON
        }
      }
    }

    if (!accessToken) return null;

    const { data: { user }, error } = await sb.auth.getUser(accessToken);
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
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

    // Link the order to the logged-in user so they can view it in their order history.
    // Primary source: user_id passed in the request body by the client (reliable).
    // Fallback: extract from Supabase auth cookie (in case client doesn't pass it).
    const userId = (body.user_id as string) || (await getUserIdFromRequest(request));

    // Build the order payload. New columns (subtotal, shipping_cost,
    // shipping_service, payment_method) may not exist yet depending on
    // which migrations have been applied. We attempt the full payload
    // first and fall back to a minimal one on "column does not exist".
    const fullPayload: Record<string, unknown> = {
      order_code: orderCode,
      user_id: userId || null,
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
      payment_method: "transfer",
    };

    const minimalPayload: Record<string, unknown> = {
      order_code: orderCode,
      user_id: userId || null,
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
      console.warn("Some order columns missing — falling back to minimal payload. Run relevant migrations.");
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
      order_code: orderCode,
      order: order,
      items: orderItems,
      subtotal,
      shipping_cost: Number.isFinite(shippingCost) ? shippingCost : 0,
      total_amount: totalAmount,
    });
  } catch (error: any) {
    console.error("PAYMENT ORDER API ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat order pembayaran." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderCode = searchParams.get("order_code")?.trim();

    if (!orderCode) {
      return NextResponse.json(
        { error: "order_code parameter wajib diisi." },
        { status: 400 }
      );
    }

    // Fetch the order
    const { data: orderRow, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_code", orderCode)
      .maybeSingle();

    if (orderErr) {
      console.error("FETCH ORDER ERROR:", orderErr);
      return NextResponse.json(
        { error: orderErr.message || "Gagal mengambil order." },
        { status: 500 }
      );
    }

    if (!orderRow) {
      return NextResponse.json(
        { error: `Order dengan kode ${orderCode} tidak ditemukan.` },
        { status: 404 }
      );
    }

    // Fetch order items
    const { data: orderItems } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .eq("order_id", orderRow.id);

    // Fetch bank settings from store_settings
    let bankInfo = { bank_name: "", bank_account_number: "", bank_account_holder: "" };
    let whatsappAdmin = "";
    try {
      const { data: bankSettings } = await supabaseAdmin
        .from("store_settings")
        .select("key, value")
        .in("key", ["bank_name", "bank_account_number", "bank_account_holder", "store_whatsapp"]);

      if (bankSettings) {
        bankSettings.forEach((row: any) => {
          if (row.key === "bank_name" && row.value) bankInfo.bank_name = row.value;
          if (row.key === "bank_account_number" && row.value) bankInfo.bank_account_number = row.value;
          if (row.key === "bank_account_holder" && row.value) bankInfo.bank_account_holder = row.value;
          if (row.key === "store_whatsapp" && row.value) whatsappAdmin = row.value;
        });
      }
    } catch (bankErr) {
      console.warn("Bank settings fetch failed:", bankErr);
      // Fallback: try getStoreSettings for whatsapp
      try {
        const settings = await getStoreSettings();
        whatsappAdmin = settings.storeWhatsapp;
      } catch {
        /* noop */
      }
    }

    return NextResponse.json({
      success: true,
      order: orderRow,
      items: orderItems || [],
      bank_info: bankInfo,
      whatsapp_admin: whatsappAdmin,
    });
  } catch (error: any) {
    console.error("GET PAYMENT ORDER ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengambil data pembayaran." },
      { status: 500 }
    );
  }
}
