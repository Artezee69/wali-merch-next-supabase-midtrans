import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { trackJneShipment, isJneConfigured, type JneTrackingResult } from "@/lib/jne";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderCode = searchParams.get("order_code")?.trim();
  const trackingNumber = searchParams.get("tracking_number")?.trim();

  if (!orderCode && !trackingNumber) {
    return NextResponse.json(
      { error: "order_code or tracking_number parameter is required." },
      { status: 400 },
    );
  }

  // If only tracking_number was provided, call JNE directly
  if (trackingNumber && !orderCode) {
    if (!isJneConfigured()) {
      return NextResponse.json({
        jne_configured: false,
        tracking_number: trackingNumber,
        events: [],
      });
    }

    const result = await trackJneShipment(trackingNumber);
    if (!result) {
      return NextResponse.json(
        { error: "JNE tracking API error." },
        { status: 500 },
      );
    }
    return NextResponse.json({
      jne_configured: true,
      ...result,
    });
  }

  // Look up order by order_code, get tracking_number, then call JNE
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("order_code, tracking_number, order_status")
    .eq("order_code", orderCode!)
    .maybeSingle();

  if (orderError || !order) {
    return NextResponse.json(
      { error: "Order tidak ditemukan." },
      { status: 404 },
    );
  }

  const trackingNum = order.tracking_number?.trim();
  if (!trackingNum) {
    return NextResponse.json({
      jne_configured: isJneConfigured(),
      order_code: orderCode,
      tracking_number: null,
      events: [],
      note: "Order belum memiliki nomor resi JNE.",
    });
  }

  if (!isJneConfigured()) {
    return NextResponse.json({
      jne_configured: false,
      order_code: orderCode,
      tracking_number: trackingNum,
      events: [],
    });
  }

  const result = await trackJneShipment(trackingNum);
  if (!result) {
    return NextResponse.json(
      { error: "JNE tracking API error." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    jne_configured: true,
    order_code: orderCode,
    ...result,
  });
}
