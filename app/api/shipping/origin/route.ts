import { NextResponse } from "next/server";
import { getOrigin } from "@/lib/shipping";

export async function GET() {
  try {
    const origin = getOrigin();
    return NextResponse.json({
      success: true,
      origin,
      courier: "JNE",
      service_default: "REG",
      description:
        "Origin point (kota asal) untuk semua pesanan. Ongkir dihitung dari titik ini ke alamat customer.",
    });
  } catch (error: any) {
    console.error("ORIGIN API ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memuat origin." },
      { status: 500 },
    );
  }
}
