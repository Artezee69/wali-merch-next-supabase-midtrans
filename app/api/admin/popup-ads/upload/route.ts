import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const path = `popup-${Date.now()}.${file.name.split(".").pop()}`;
  const { error } = await supabaseAdmin.storage.from("popup-ads").upload(path, file, { contentType: file.type });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: urlData } = supabaseAdmin.storage.from("popup-ads").getPublicUrl(path);
  return NextResponse.json({ success: true, url: urlData.publicUrl });
}
