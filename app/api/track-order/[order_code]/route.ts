import { NextRequest, NextResponse } from "next/server";
import { supabasePublic } from "@/lib/supabasePublic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ order_code: string }> }
) {
  try {
    const { order_code } = await params;

    if (!order_code) {
      return NextResponse.json(
        { error: "Order code is required" },
        { status: 400 }
      );
    }

    const supabase = supabasePublic;

    const { data: order, error } = await supabase
      .from("orders")
      .select(`*, order_items (*)`)
      .eq("order_code", order_code)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to fetch order" },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
