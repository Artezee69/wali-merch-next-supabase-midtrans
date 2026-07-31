import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, status } = body;

  if (!id || status === undefined) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("popup_ads")
    .update({ status })
    .eq("id", id)
    .select("*");

  if (error) {
    console.error("ERROR UPDATE POPUP:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data?.[0] });
}
