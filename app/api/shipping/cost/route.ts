import { NextResponse } from "next/server";
import {
  calculateShipping,
  estimateWeight,
  getOrigin,
  type ShippingOption,
} from "@/lib/shipping";

type RequestBody = {
  city?: string;
  postal_code?: string;
  item_count?: number;
  weight_kg?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const city = (body.city || "").trim();
    const postalCode = (body.postal_code || "").trim();
    const itemCount = Number(body.item_count || 0);

    if (!city && !postalCode) {
      return NextResponse.json(
        {
          error: "Kota atau kode pos wajib diisi untuk menghitung ongkir.",
        },
        { status: 400 },
      );
    }

    // Estimate weight — allow override via weight_kg
    const weightKg =
      body.weight_kg && Number(body.weight_kg) > 0
        ? Number(body.weight_kg)
        : estimateWeight(itemCount || 1);

    const options: ShippingOption[] = calculateShipping(
      city,
      postalCode,
      weightKg,
    );

    // Find the recommended one (default to REG — the only option we return)
    const recommended =
      options.find((o) => o.isRecommended) || options[0];

    return NextResponse.json({
      success: true,
      origin: getOrigin(),
      destination: {
        city: city || null,
        postal_code: postalCode || null,
      },
      weight_kg: weightKg,
      billable_kg: Math.max(1, Math.ceil(weightKg)),
      options,
      recommended_service: recommended?.service,
      currency: "IDR",
    });
  } catch (error: any) {
    console.error("SHIPPING API ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghitung ongkir." },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "JNE Indonesia",
    origin: getOrigin(),
    description:
      "Hitung ongkos kirim dari Tangerang Selatan ke seluruh Indonesia via JNE REG (sudah termasuk biaya admin Rp 5.000/kg).",
    method: "POST",
    payload: {
      city: "string (contoh: 'Bandung')",
      postal_code: "string (contoh: '40115')",
      item_count: "number (jumlah item di cart)",
      weight_kg: "number (opsional, override estimasi berat)",
    },
  });
}
