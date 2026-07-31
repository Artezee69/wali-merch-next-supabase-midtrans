import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...data } = body;

  if (id) {
    // Update
    const { data: result, error } = await supabaseAdmin
      .from("popup_ads")
      .update(data)
      .eq("id", id)
      .select("*");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: result?.[0] });
  } else {
    // Create
    const { data: result, error } = await supabaseAdmin
      .from("popup_ads")
      .insert(data)
      .select("*");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: result?.[0] });
  }
}
