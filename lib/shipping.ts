// =====================================================
// JNE Shipping Cost Calculator
// Based on real-world JNE Indonesia tariff zones
// Origin: Tangerang Selatan (15314)
// =====================================================

export type ShippingService = "OKE" | "REG" | "YES" | "SS";

export type ShippingOption = {
  service: ShippingService;
  name: string;
  description: string;
  etd: string;
  cost: number;
  isRecommended?: boolean;
};

export type CityData = {
  city: string;
  province: string;
  zone: number; // 1-6 (closer = cheaper)
  postal_prefix: string[];
};

// Realistic Indonesian major cities mapped to JNE tariff zones
// Zone 1 = Jabodetabek, Zone 6 = Papua/Maluku
const CITIES: CityData[] = [
  // Zone 1 — Jabodetabek (Rp 8.000/kg OKE)
  { city: "Jakarta", province: "DKI Jakarta", zone: 1, postal_prefix: ["10", "11", "12"] },
  { city: "Jakarta Pusat", province: "DKI Jakarta", zone: 1, postal_prefix: ["10"] },
  { city: "Jakarta Barat", province: "DKI Jakarta", zone: 1, postal_prefix: ["11"] },
  { city: "Jakarta Selatan", province: "DKI Jakarta", zone: 1, postal_prefix: ["12"] },
  { city: "Jakarta Timur", province: "DKI Jakarta", zone: 1, postal_prefix: ["13"] },
  { city: "Jakarta Utara", province: "DKI Jakarta", zone: 1, postal_prefix: ["14"] },
  { city: "Tangerang", province: "Banten", zone: 1, postal_prefix: ["15"] },
  { city: "Tangerang Selatan", province: "Banten", zone: 1, postal_prefix: ["15"] },
  { city: "Tangerang Kabupaten", province: "Banten", zone: 1, postal_prefix: ["15"] },
  { city: "Serpong", province: "Banten", zone: 1, postal_prefix: ["15"] },
  { city: "Alam Sutera", province: "Banten", zone: 1, postal_prefix: ["15"] },
  { city: "BSD", province: "Banten", zone: 1, postal_prefix: ["15"] },
  { city: "Bekasi", province: "Jawa Barat", zone: 1, postal_prefix: ["17"] },
  { city: "Depok", province: "Jawa Barat", zone: 1, postal_prefix: ["16"] },
  { city: "Bogor", province: "Jawa Barat", zone: 1, postal_prefix: ["16"] },
  { city: "Cibubur", province: "Jawa Barat", zone: 1, postal_prefix: ["17"] },
  { city: "Cikarang", province: "Jawa Barat", zone: 1, postal_prefix: ["17"] },

  // Zone 2 — Banten, Jawa Barat (non-Jabodetabek), Jawa Tengah dekat (Rp 13.000/kg)
  { city: "Cilegon", province: "Banten", zone: 2, postal_prefix: ["42"] },
  { city: "Serang", province: "Banten", zone: 2, postal_prefix: ["42"] },
  { city: "Pandeglang", province: "Banten", zone: 2, postal_prefix: ["42"] },
  { city: "Lebak", province: "Banten", zone: 2, postal_prefix: ["42"] },
  { city: "Bandung", province: "Jawa Barat", zone: 2, postal_prefix: ["40", "41"] },
  { city: "Cimahi", province: "Jawa Barat", zone: 2, postal_prefix: ["40"] },
  { city: "Sumedang", province: "Jawa Barat", zone: 2, postal_prefix: ["45"] },
  { city: "Purwakarta", province: "Jawa Barat", zone: 2, postal_prefix: ["41"] },
  { city: "Subang", province: "Jawa Barat", zone: 2, postal_prefix: ["41"] },
  { city: "Karawang", province: "Jawa Barat", zone: 2, postal_prefix: ["41"] },
  { city: "Cirebon", province: "Jawa Barat", zone: 2, postal_prefix: ["45"] },
  { city: "Indramayu", province: "Jawa Barat", zone: 2, postal_prefix: ["45"] },
  { city: "Sukabumi", province: "Jawa Barat", zone: 2, postal_prefix: ["43"] },
  { city: "Cianjur", province: "Jawa Barat", zone: 2, postal_prefix: ["43"] },
  { city: "Garut", province: "Jawa Barat", zone: 2, postal_prefix: ["44"] },
  { city: "Tasikmalaya", province: "Jawa Barat", zone: 2, postal_prefix: ["46"] },
  { city: "Ciamis", province: "Jawa Barat", zone: 2, postal_prefix: ["46"] },
  { city: "Banjar", province: "Jawa Barat", zone: 2, postal_prefix: ["46"] },

  // Zone 3 — Jawa Tengah, DI Yogyakarta, Jawa Timur barat (Rp 18.000/kg)
  { city: "Semarang", province: "Jawa Tengah", zone: 3, postal_prefix: ["50", "50"] },
  { city: "Solo", province: "Jawa Tengah", zone: 3, postal_prefix: ["57"] },
  { city: "Surakarta", province: "Jawa Tengah", zone: 3, postal_prefix: ["57"] },
  { city: "Yogyakarta", province: "DI Yogyakarta", zone: 3, postal_prefix: ["55"] },
  { city: "Yogya", province: "DI Yogyakarta", zone: 3, postal_prefix: ["55"] },
  { city: "Sleman", province: "DI Yogyakarta", zone: 3, postal_prefix: ["55"] },
  { city: "Bantul", province: "DI Yogyakarta", zone: 3, postal_prefix: ["55"] },
  { city: "Magelang", province: "Jawa Tengah", zone: 3, postal_prefix: ["56"] },
  { city: "Salatiga", province: "Jawa Tengah", zone: 3, postal_prefix: ["50"] },
  { city: "Pekalongan", province: "Jawa Tengah", zone: 3, postal_prefix: ["51"] },
  { city: "Tegal", province: "Jawa Tengah", zone: 3, postal_prefix: ["52"] },
  { city: "Brebes", province: "Jawa Tengah", zone: 3, postal_prefix: ["52"] },
  { city: "Cilacap", province: "Jawa Tengah", zone: 3, postal_prefix: ["53"] },
  { city: "Purwokerto", province: "Jawa Tengah", zone: 3, postal_prefix: ["53"] },
  { city: "Banyumas", province: "Jawa Tengah", zone: 3, postal_prefix: ["53"] },
  { city: "Kudus", province: "Jawa Tengah", zone: 3, postal_prefix: ["59"] },
  { city: "Jepara", province: "Jawa Tengah", zone: 3, postal_prefix: ["59"] },
  { city: "Pati", province: "Jawa Tengah", zone: 3, postal_prefix: ["59"] },
  { city: "Rembang", province: "Jawa Tengah", zone: 3, postal_prefix: ["59"] },
  { city: "Blora", province: "Jawa Tengah", zone: 3, postal_prefix: ["58"] },
  { city: "Sragen", province: "Jawa Tengah", zone: 3, postal_prefix: ["57"] },
  { city: "Klaten", province: "Jawa Tengah", zone: 3, postal_prefix: ["57"] },
  { city: "Boyolali", province: "Jawa Tengah", zone: 3, postal_prefix: ["57"] },

  // Zone 4 — Jawa Timur, Bali, NTB (Rp 23.000/kg)
  { city: "Surabaya", province: "Jawa Timur", zone: 4, postal_prefix: ["60", "61"] },
  { city: "Sidoarjo", province: "Jawa Timur", zone: 4, postal_prefix: ["61"] },
  { city: "Gresik", province: "Jawa Timur", zone: 4, postal_prefix: ["61"] },
  { city: "Mojokerto", province: "Jawa Timur", zone: 4, postal_prefix: ["61"] },
  { city: "Pasuruan", province: "Jawa Timur", zone: 4, postal_prefix: ["67"] },
  { city: "Probolinggo", province: "Jawa Timur", zone: 4, postal_prefix: ["67"] },
  { city: "Malang", province: "Jawa Timur", zone: 4, postal_prefix: ["65"] },
  { city: "Batu", province: "Jawa Timur", zone: 4, postal_prefix: ["65"] },
  { city: "Blitar", province: "Jawa Timur", zone: 4, postal_prefix: ["66"] },
  { city: "Tulungagung", province: "Jawa Timur", zone: 4, postal_prefix: ["66"] },
  { city: "Trenggalek", province: "Jawa Timur", zone: 4, postal_prefix: ["66"] },
  { city: "Ponorogo", province: "Jawa Timur", zone: 4, postal_prefix: ["63"] },
  { city: "Madiun", province: "Jawa Timur", zone: 4, postal_prefix: ["63"] },
  { city: "Ngawi", province: "Jawa Timur", zone: 4, postal_prefix: ["63"] },
  { city: "Magetan", province: "Jawa Timur", zone: 4, postal_prefix: ["63"] },
  { city: "Pacitan", province: "Jawa Timur", zone: 4, postal_prefix: ["63"] },
  { city: "Bojonegoro", province: "Jawa Timur", zone: 4, postal_prefix: ["62"] },
  { city: "Tuban", province: "Jawa Timur", zone: 4, postal_prefix: ["62"] },
  { city: "Lamongan", province: "Jawa Timur", zone: 4, postal_prefix: ["62"] },
  { city: "Bangkalan", province: "Jawa Timur", zone: 4, postal_prefix: ["69"] },
  { city: "Sampang", province: "Jawa Timur", zone: 4, postal_prefix: ["69"] },
  { city: "Pamekasan", province: "Jawa Timur", zone: 4, postal_prefix: ["69"] },
  { city: "Sumenep", province: "Jawa Timur", zone: 4, postal_prefix: ["69"] },
  { city: "Jember", province: "Jawa Timur", zone: 4, postal_prefix: ["68"] },
  { city: "Banyuwangi", province: "Jawa Timur", zone: 4, postal_prefix: ["68"] },
  { city: "Situbondo", province: "Jawa Timur", zone: 4, postal_prefix: ["68"] },
  { city: "Bondowoso", province: "Jawa Timur", zone: 4, postal_prefix: ["68"] },
  { city: "Lumajang", province: "Jawa Timur", zone: 4, postal_prefix: ["67"] },
  { city: "Denpasar", province: "Bali", zone: 4, postal_prefix: ["80"] },
  { city: "Badung", province: "Bali", zone: 4, postal_prefix: ["80"] },
  { city: "Gianyar", province: "Bali", zone: 4, postal_prefix: ["80"] },
  { city: "Tabanan", province: "Bali", zone: 4, postal_prefix: ["82"] },
  { city: "Bangli", province: "Bali", zone: 4, postal_prefix: ["80"] },
  { city: "Klungkung", province: "Bali", zone: 4, postal_prefix: ["80"] },
  { city: "Karangasem", province: "Bali", zone: 4, postal_prefix: ["80"] },
  { city: "Buleleng", province: "Bali", zone: 4, postal_prefix: ["81"] },
  { city: "Jembrana", province: "Bali", zone: 4, postal_prefix: ["82"] },
  { city: "Mataram", province: "Nusa Tenggara Barat", zone: 4, postal_prefix: ["83"] },
  { city: "Lombok", province: "Nusa Tenggara Barat", zone: 4, postal_prefix: ["83"] },
  { city: "Bima", province: "Nusa Tenggara Barat", zone: 4, postal_prefix: ["84"] },
  { city: "Sumbawa", province: "Nusa Tenggara Barat", zone: 4, postal_prefix: ["84"] },

  // Zone 5 — Sumatera, Kalimantan, Sulawesi (Rp 33.000/kg)
  { city: "Bandar Lampung", province: "Lampung", zone: 5, postal_prefix: ["35"] },
  { city: "Metro", province: "Lampung", zone: 5, postal_prefix: ["34"] },
  { city: "Palembang", province: "Sumatera Selatan", zone: 5, postal_prefix: ["30", "30"] },
  { city: "Lubuklinggau", province: "Sumatera Selatan", zone: 5, postal_prefix: ["31"] },
  { city: "Prabumulih", province: "Sumatera Selatan", zone: 5, postal_prefix: ["31"] },
  { city: "Bengkulu", province: "Bengkulu", zone: 5, postal_prefix: ["38"] },
  { city: "Jambi", province: "Jambi", zone: 5, postal_prefix: ["36"] },
  { city: "Sungai Penuh", province: "Jambi", zone: 5, postal_prefix: ["37"] },
  { city: "Pekanbaru", province: "Riau", zone: 5, postal_prefix: ["28"] },
  { city: "Dumai", province: "Riau", zone: 5, postal_prefix: ["28"] },
  { city: "Padang", province: "Sumatera Barat", zone: 5, postal_prefix: ["25", "25"] },
  { city: "Bukittinggi", province: "Sumatera Barat", zone: 5, postal_prefix: ["26"] },
  { city: "Solok", province: "Sumatera Barat", zone: 5, postal_prefix: ["27"] },
  { city: "Payakumbuh", province: "Sumatera Barat", zone: 5, postal_prefix: ["26"] },
  { city: "Painan", province: "Sumatera Barat", zone: 5, postal_prefix: ["25"] },
  { city: "Medan", province: "Sumatera Utara", zone: 5, postal_prefix: ["20", "20"] },
  { city: "Binjai", province: "Sumatera Utara", zone: 5, postal_prefix: ["20"] },
  { city: "Pematangsiantar", province: "Sumatera Utara", zone: 5, postal_prefix: ["21"] },
  { city: "Tanjungbalai", province: "Sumatera Utara", zone: 5, postal_prefix: ["21"] },
  { city: "Tebing Tinggi", province: "Sumatera Utara", zone: 5, postal_prefix: ["20"] },
  { city: "Padang Sidempuan", province: "Sumatera Utara", zone: 5, postal_prefix: ["22"] },
  { city: "Gunungsitoli", province: "Sumatera Utara", zone: 5, postal_prefix: ["22"] },
  { city: "Sibolga", province: "Sumatera Utara", zone: 5, postal_prefix: ["22"] },
  { city: "Brastagi", province: "Sumatera Utara", zone: 5, postal_prefix: ["22"] },
  { city: "Banda Aceh", province: "Aceh", zone: 5, postal_prefix: ["23"] },
  { city: "Sabang", province: "Aceh", zone: 5, postal_prefix: ["23"] },
  { city: "Lhokseumawe", province: "Aceh", zone: 5, postal_prefix: ["24"] },
  { city: "Langsa", province: "Aceh", zone: 5, postal_prefix: ["24"] },
  { city: "Subulussalam", province: "Aceh", zone: 5, postal_prefix: ["24"] },
  { city: "Pangkal Pinang", province: "Bangka Belitung", zone: 5, postal_prefix: ["33"] },
  { city: "Tanjung Pandan", province: "Bangka Belitung", zone: 5, postal_prefix: ["33"] },
  { city: "Tanjungpinang", province: "Kepulauan Riau", zone: 5, postal_prefix: ["29"] },
  { city: "Batam", province: "Kepulauan Riau", zone: 5, postal_prefix: ["29"] },
  { city: "Pontianak", province: "Kalimantan Barat", zone: 5, postal_prefix: ["78"] },
  { city: "Singkawang", province: "Kalimantan Barat", zone: 5, postal_prefix: ["79"] },
  { city: "Sintang", province: "Kalimantan Barat", zone: 5, postal_prefix: ["78"] },
  { city: "Palangkaraya", province: "Kalimantan Tengah", zone: 5, postal_prefix: ["73"] },
  { city: "Sampit", province: "Kalimantan Tengah", zone: 5, postal_prefix: ["74"] },
  { city: "Banjarmasin", province: "Kalimantan Selatan", zone: 5, postal_prefix: ["70", "70"] },
  { city: "Banjarbaru", province: "Kalimantan Selatan", zone: 5, postal_prefix: ["70"] },
  { city: "Samarinda", province: "Kalimantan Timur", zone: 5, postal_prefix: ["75"] },
  { city: "Balikpapan", province: "Kalimantan Timur", zone: 5, postal_prefix: ["76"] },
  { city: "Bontang", province: "Kalimantan Timur", zone: 5, postal_prefix: ["75"] },
  { city: "Tarakan", province: "Kalimantan Utara", zone: 5, postal_prefix: ["77"] },
  { city: "Makassar", province: "Sulawesi Selatan", zone: 5, postal_prefix: ["90", "90"] },
  { city: "Parepare", province: "Sulawesi Selatan", zone: 5, postal_prefix: ["91"] },
  { city: "Palopo", province: "Sulawesi Selatan", zone: 5, postal_prefix: ["91"] },
  { city: "Kendari", province: "Sulawesi Tenggara", zone: 5, postal_prefix: ["93"] },
  { city: "Baubau", province: "Sulawesi Tenggara", zone: 5, postal_prefix: ["93"] },
  { city: "Palu", province: "Sulawesi Tengah", zone: 5, postal_prefix: ["94"] },
  { city: "Luwuk", province: "Sulawesi Tengah", zone: 5, postal_prefix: ["94"] },
  { city: "Manado", province: "Sulawesi Utara", zone: 5, postal_prefix: ["95"] },
  { city: "Bitung", province: "Sulawesi Utara", zone: 5, postal_prefix: ["95"] },
  { city: "Kotamobagu", province: "Sulawesi Utara", zone: 5, postal_prefix: ["95"] },
  { city: "Gorontalo", province: "Gorontalo", zone: 5, postal_prefix: ["96"] },

  // Zone 6 — NTT, Maluku, Papua (Rp 45.000/kg)
  { city: "Kupang", province: "Nusa Tenggara Timur", zone: 6, postal_prefix: ["85"] },
  { city: "Soe", province: "Nusa Tenggara Timur", zone: 6, postal_prefix: ["85"] },
  { city: "Atambua", province: "Nusa Tenggara Timur", zone: 6, postal_prefix: ["85"] },
  { city: "Maumere", province: "Nusa Tenggara Timur", zone: 6, postal_prefix: ["86"] },
  { city: "Ende", province: "Nusa Tenggara Timur", zone: 6, postal_prefix: ["86"] },
  { city: "Larantuka", province: "Nusa Tenggara Timur", zone: 6, postal_prefix: ["86"] },
  { city: "Waingapu", province: "Nusa Tenggara Timur", zone: 6, postal_prefix: ["87"] },
  { city: "Ruteng", province: "Nusa Tenggara Timur", zone: 6, postal_prefix: ["86"] },
  { city: "Ambon", province: "Maluku", zone: 6, postal_prefix: ["97"] },
  { city: "Tual", province: "Maluku", zone: 6, postal_prefix: ["97"] },
  { city: "Ternate", province: "Maluku Utara", zone: 6, postal_prefix: ["97"] },
  { city: "Sofifi", province: "Maluku Utara", zone: 6, postal_prefix: ["97"] },
  { city: "Jayapura", province: "Papua", zone: 6, postal_prefix: ["99"] },
  { city: "Sorong", province: "Papua Barat", zone: 6, postal_prefix: ["98"] },
  { city: "Manokwari", province: "Papua Barat", zone: 6, postal_prefix: ["98"] },
  { city: "Biak", province: "Papua", zone: 6, postal_prefix: ["98"] },
  { city: "Merauke", province: "Papua", zone: 6, postal_prefix: ["99"] },
  { city: "Timika", province: "Papua", zone: 6, postal_prefix: ["99"] },
  { city: "Nabire", province: "Papua", zone: 6, postal_prefix: ["98"] },
];

// JNE pricing per kg by zone (approximation matching real JNE tariff)
// +5000 markup per kg applied on top of base JNE REG rate
const REG_MARKUP_PER_KG = 5000;

const ZONE_RATES: Record<number, { OKE: number; REG: number; YES: number; SS: number }> = {
  1: { OKE: 8000, REG: 10000, YES: 18000, SS: 28000 },
  2: { OKE: 13000, REG: 16000, YES: 26000, SS: 36000 },
  3: { OKE: 18000, REG: 22000, YES: 34000, SS: 44000 },
  4: { OKE: 23000, REG: 28000, YES: 42000, SS: 52000 },
  5: { OKE: 33000, REG: 40000, YES: 58000, SS: 68000 },
  6: { OKE: 45000, REG: 55000, YES: 78000, SS: 88000 },
};

const SERVICE_ETD: Record<ShippingService, string> = {
  OKE: "4-6 hari",
  REG: "2-3 hari",
  YES: "1-2 hari (berikutnya)",
  SS: "Same day (S&K)",
};

const SERVICE_DESCRIPTIONS: Record<ShippingService, string> = {
  OKE: "Ongkos Kirim Ekonomis — paling hemat",
  REG: "Regular — estimasi paling konsisten",
  YES: "Yakin Esok Sampai — sampai besok",
  SS: "Super Speed — sampai di hari yang sama",
};

/**
 * Find a city entry by fuzzy matching on city name and postal code prefix.
 * Returns null if no match (caller falls back to default zone).
 */
export function findCity(city: string, postalCode: string): CityData | null {
  const cityLower = city.toLowerCase().trim();
  const postal = postalCode.trim().slice(0, 2);

  if (postal) {
    const match = CITIES.find(
      (c) => c.postal_prefix.some((p) => p === postal) &&
        cityLower.includes(c.city.toLowerCase().split(" ")[0]),
    );
    if (match) return match;
  }

  // Fuzzy match by city name
  for (const c of CITIES) {
    if (cityLower.includes(c.city.toLowerCase())) return c;
  }

  // Postal-only fallback
  if (postal) {
    const postalMatch = CITIES.find((c) =>
      c.postal_prefix.some((p) => p === postal),
    );
    if (postalMatch) return postalMatch;
  }

  return null;
}

/**
 * Get the destination zone. Falls back to zone 4 if city is unknown.
 */
export function getZone(city: string, postalCode: string): {
  zone: number;
  matched: CityData | null;
} {
  const matched = findCity(city, postalCode);
  if (matched) return { zone: matched.zone, matched };
  return { zone: 4, matched: null };
}

/**
 * Estimate package weight in kg.
 * Default: 0.5 kg per item (typical merchandise apparel).
 * Min 1 kg chargeable.
 */
export function estimateWeight(itemCount: number): number {
  const estimated = itemCount * 0.5;
  return Math.max(1, Math.ceil(estimated));
}

/**
 * Calculate shipping options for given destination.
 * Returns only JNE REG service with +5000/kg markup applied.
 */
export function calculateShipping(
  city: string,
  postalCode: string,
  weightKg: number,
): ShippingOption[] {
  const { zone, matched } = getZone(city, postalCode);
  const rates = ZONE_RATES[zone];
  const billable = Math.max(1, Math.ceil(weightKg));

  // Markup +5000 per kg applied to JNE REG rate
  const regRate = rates.REG + REG_MARKUP_PER_KG;
  const totalCost = regRate * billable;

  // Return only JNE REG
  const options: ShippingOption[] = [
    {
      service: "REG",
      name: "JNE REG",
      description: SERVICE_DESCRIPTIONS.REG,
      etd: SERVICE_ETD.REG,
      cost: totalCost,
      isRecommended: true,
    },
  ];

  return options;
}

/**
 * Get origin city info (Tangerang Selatan — WALI Merch HQ).
 */
export function getOrigin() {
  return {
    city: "Tangerang Selatan",
    province: "Banten",
    postalCode: "15314",
  };
}

export const ORIGIN = getOrigin();
