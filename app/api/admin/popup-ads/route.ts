import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// POST /api/admin/popup-ads — create or update
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { image_url, link, sort_order, status } = body;

  const { error } = await supabaseAdmin.from("popup_ads").insert({
    image_url,
    link,
    sort_order: sort_order ?? 0,
    status: status ?? true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// PATCH /api/admin/popup-ads/toggle — toggle status
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status } = await request.json();
  const { error } = await supabaseAdmin.from("popup_ads").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/admin/popup-ads/delete?id=1
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  const { error } = await supabaseAdmin.from("popup_ads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
