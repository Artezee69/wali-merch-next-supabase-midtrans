import { getSupabaseAdmin } from "./supabaseAdmin";

// =============================================================================
// lib/homeContent.ts
// -----------------------------------------------------------------------------
// Server-side accessor untuk `public.home_content` (JSON key-value).
// Dipakai oleh:
//   - app/page.tsx           : untuk render sections dengan content dinamis
//   - app/admin/settings/    : untuk load/save dari admin panel
//   - app/api/admin/settings/save/route.ts
//
// Setiap `key` punya shape JSON yang kita definisikan di bawah. Untuk menjaga
// type-safety, ada konstanta DEFAULT untuk tiap key — jika tabel kosong atau
// error, kita fallback ke DEFAULT sehingga UI tidak crash.
// =============================================================================

export type HomepageStat = {
  id: string;
  value: string;
  label: string;
};

export type TrustBadge = {
  id: string;
  text: string;
  icon: string;
  enabled: boolean;
};

export type HomeHero = {
  badge: string;
  badgePill: string;
  headlineLine1: string;
  headlineLine2a: string;
  headlineLine2b: string;
  subheadline: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  trust1: string;
  trust2: string;
  trust3: string;
  backgroundType?: "gradient" | "solid" | "image";
  backgroundColor?: string;
  backgroundImageUrl?: string;
  backgroundGradient?: string;
  backgroundOverlay?: number;
  backgroundOpacity?: number;
};

export type HomeMarquee = {
  items: string[];
};

export type HomeWhyWaliItem = { title: string; body: string };
export type HomeWhyWali = {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: HomeWhyWaliItem[];
};

export type HomeShowcase = {
  productIds: string[];
};

// `showcase` in `HomeContent` carries only copy (text shown around the
// product grid). The product grid itself is fetched by the showcase
// page (ProductShowcase) using the regular product query — the home
// section does not pin a specific set of product IDs. `HomeShowcase`
// above is kept as a placeholder for a future "curated" showcase and
// is intentionally not part of `HomeContent`.
export type HomeShowcaseCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  viewAllLabel: string;
  emptyLabel: string;
};

export type HomeHowToOrderStep = { title: string; body: string };
export type HomeHowToOrder = {
  eyebrow: string;
  title: string;
  subtitle: string;
  steps: HomeHowToOrderStep[];
};

export type HomeCta = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

export type HomeFaqItem = { q: string; a: string };
export type HomeFaq = {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: HomeFaqItem[];
};

export type HomeContent = {
  hero: HomeHero;
  marquee: HomeMarquee;
  why_wali: HomeWhyWali;
  how_to_order: HomeHowToOrder;
  cta: HomeCta;
  faq: HomeFaq;
  showcase: HomeShowcaseCopy;
};

// -----------------------------------------------------------------------------
// Default values — mirror of what's seeded in 010_home_content.sql. When a row
// is missing in the DB or the JSON is malformed, we fall back to these so the
// homepage never breaks.
// -----------------------------------------------------------------------------
export const DEFAULT_HERO: HomeHero = {
  badge: "Official Drop · 2026",
  badgePill: "SS/26 Capsule",
  headlineLine1: "Wear The",
  headlineLine2a: "Stage",
  headlineLine2b: "Energy",
  subheadline:
    "Merchandise resmi WALI yang dirancang untuk fans, player, dan panggung. Material premium, jahitan rapi, dan siluet yang siap menemani setiap momen.",
  primaryCtaLabel: "Shop Collection",
  primaryCtaHref: "/products",
  secondaryCtaLabel: "Track Order",
  secondaryCtaHref: "/track-order",
  stat1Value: "2.400+",
  stat1Label: "Pieces Shipped",
  stat2Value: "100%",
  stat2Label: "Official",
  stat3Value: "1–2d",
  stat3Label: "Process",
  trust1: "Garansi resmi",
  trust2: "Midtrans secured checkout",
  trust3: "Limited capsule",
  backgroundImageUrl: "",
  backgroundOverlay: 50,
  backgroundType: "gradient",
  backgroundColor: "#0b0b0b",
  backgroundGradient: "",
  backgroundOpacity: undefined,
};

export const DEFAULT_MARQUEE: HomeMarquee = {
  items: [
    "Free Shipping Pulau Jawa",
    "Official Merchandise WALI",
    "Limited Drop Setiap Bulan",
    "Garansi Produk Resmi",
    "Bahan Premium & Awet",
  ],
};

export const DEFAULT_WHY_WALI: HomeWhyWali = {
  eyebrow: "Mengapa WALI",
  title: "Bukan Sekadar Merch. Ini Tanda Pengalaman.",
  subtitle:
    "Setiap item dibuat dengan perhatian yang sama terhadap detail yang kami berikan pada panggung — supaya kenangan bertahan lebih lama dari tur.",
  items: [
    {
      title: "Bahan Premium",
      body:
        "Cotton combed 24s–30s dan French terry tebal yang tidak mudah melar setelah dicuci.",
    },
    {
      title: "Jahitan Rapi",
      body:
        "Double-needle stitch di setiap sambungan agar kuat dipakai harian maupun di panggung.",
    },
    {
      title: "Desain Eksklusif",
      body: "Dirancang langsung oleh tim kreatif WALI — tidak dijual di tempat lain.",
    },
    {
      title: "Garansi Resmi",
      body:
        "Kalau ada cacat produksi, kami ganti baru tanpa ribet. S&K berlaku.",
    },
  ],
};

export const DEFAULT_HOW_TO_ORDER: HomeHowToOrder = {
  eyebrow: "Cara Order",
  title: "Dari Pilih Produk sampai Paket Datang",
  subtitle:
    "Empat langkah simpel. Tidak perlu chat admin, tidak perlu nunggu konfirmasi manual.",
  steps: [
    {
      title: "Pilih Produk",
      body:
        "Telusuri koleksi di halaman Products. Pilih varian size dan warna yang kamu mau.",
    },
    {
      title: "Checkout",
      body:
        "Isi nama, alamat, dan nomor WhatsApp. Pilih metode pembayaran Midtrans favoritmu.",
    },
    {
      title: "Bayar",
      body:
        "Selesaikan pembayaran via QRIS, virtual account, e-wallet, atau kartu kredit.",
    },
    {
      title: "Paket Dikirim",
      body:
        "Pesanan diproses 1–2 hari kerja, lalu dikirim via ekspedisi ke alamatmu.",
    },
  ],
};

export const DEFAULT_CTA: HomeCta = {
  eyebrow: "Siap Naik Level?",
  title: "Pakai WALI. Bawa Pulang Cerita Panggung.",
  subtitle:
    "Capsule resmi WALI — siap menemani latihan, nonton bareng, atau tampil di panggung komunitasmu.",
  primaryLabel: "Belanja Sekarang",
  primaryHref: "/products",
  secondaryLabel: "Lacak Pesanan",
  secondaryHref: "/track-order",
};

export const DEFAULT_FAQ: HomeFaq = {
  eyebrow: "Pertanyaan Umum",
  title: "Yang Sering Ditanyain",
  subtitle:
    "Belum ketemu jawabannya? Chat admin via WhatsApp di footer.",
  items: [
    {
      q: "Apakah produk ini original?",
      a: "Ya, semua merchandise di WALI Official Merchandise adalah barang resmi yang diproduksi langsung oleh tim WALI.",
    },
    {
      q: "Berapa lama pesanan diproses?",
      a: "Pesanan diproses dalam 1–2 hari kerja setelah pembayaran diterima. Hari besar dan weekend bisa lebih lama.",
    },
    {
      q: "Apakah bisa COD?",
      a: "Saat ini pembayaran menggunakan Midtrans (QRIS, virtual account, e-wallet, kartu kredit). COD belum tersedia.",
    },
    {
      q: "Bagaimana jika ukuran tidak pas?",
      a: "Kami menyediakan size guide di setiap halaman produk. Jika tetap tidak pas, hubungi admin via WhatsApp untuk solusi terbaik.",
    },
    {
      q: "Apakah ada garansi?",
      a: "Ya, kami memberikan garansi untuk cacat produksi. Klaim garansi dapat diajukan melalui WhatsApp admin dengan menyertakan foto dan nomor pesanan.",
    },
  ],
};

export const DEFAULT_SHOWCASE: HomeShowcaseCopy = {
  eyebrow: "Koleksi Pilihan",
  title: "Baju yang Bikin Penampilan Terasa Panggung.",
  subtitle:
    "Pilihan item yang paling banyak di-restock minggu ini. Limited capsule, tidak di-print ulang.",
  viewAllLabel: "Lihat Semua Koleksi",
  emptyLabel: "Belum ada produk yang dipublikasikan.",
};

// -----------------------------------------------------------------------------
// Validators — each returns a sanitized object using defaults for any
// malformed/missing field. This means admin mistakes (empty strings, wrong
// shape) cannot crash the homepage render.
// -----------------------------------------------------------------------------
function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function sanitizeHero(raw: unknown): HomeHero {
  const o = isObject(raw) ? raw : {};
  return {
    badge: isString(o.badge) ? o.badge : DEFAULT_HERO.badge,
    badgePill: isString(o.badgePill) ? o.badgePill : DEFAULT_HERO.badgePill,
    headlineLine1: isString(o.headlineLine1) ? o.headlineLine1 : DEFAULT_HERO.headlineLine1,
    headlineLine2a: isString(o.headlineLine2a) ? o.headlineLine2a : DEFAULT_HERO.headlineLine2a,
    headlineLine2b: isString(o.headlineLine2b) ? o.headlineLine2b : DEFAULT_HERO.headlineLine2b,
    subheadline: isString(o.subheadline) ? o.subheadline : DEFAULT_HERO.subheadline,
    primaryCtaLabel: isString(o.primaryCtaLabel) ? o.primaryCtaLabel : DEFAULT_HERO.primaryCtaLabel,
    primaryCtaHref: isString(o.primaryCtaHref) ? o.primaryCtaHref : DEFAULT_HERO.primaryCtaHref,
    secondaryCtaLabel: isString(o.secondaryCtaLabel) ? o.secondaryCtaLabel : DEFAULT_HERO.secondaryCtaLabel,
    secondaryCtaHref: isString(o.secondaryCtaHref) ? o.secondaryCtaHref : DEFAULT_HERO.secondaryCtaHref,
    stat1Value: isString(o.stat1Value) ? o.stat1Value : DEFAULT_HERO.stat1Value,
    stat1Label: isString(o.stat1Label) ? o.stat1Label : DEFAULT_HERO.stat1Label,
    stat2Value: isString(o.stat2Value) ? o.stat2Value : DEFAULT_HERO.stat2Value,
    stat2Label: isString(o.stat2Label) ? o.stat2Label : DEFAULT_HERO.stat2Label,
    stat3Value: isString(o.stat3Value) ? o.stat3Value : DEFAULT_HERO.stat3Value,
    stat3Label: isString(o.stat3Label) ? o.stat3Label : DEFAULT_HERO.stat3Label,
    trust1: isString(o.trust1) ? o.trust1 : DEFAULT_HERO.trust1,
    trust2: isString(o.trust2) ? o.trust2 : DEFAULT_HERO.trust2,
    trust3: isString(o.trust3) ? o.trust3 : DEFAULT_HERO.trust3,
    backgroundImageUrl: isString(o.backgroundImageUrl) ? o.backgroundImageUrl : DEFAULT_HERO.backgroundImageUrl,
    backgroundOverlay: typeof o.backgroundOverlay === "number" ? o.backgroundOverlay : DEFAULT_HERO.backgroundOverlay,
    backgroundType: (typeof o.backgroundType === "string" && ["gradient","solid","image"].includes(o.backgroundType) ? o.backgroundType : DEFAULT_HERO.backgroundType) as HomeHero["backgroundType"],
    backgroundColor: isString(o.backgroundColor) ? o.backgroundColor : DEFAULT_HERO.backgroundColor,
    backgroundGradient: isString(o.backgroundGradient) ? o.backgroundGradient : DEFAULT_HERO.backgroundGradient,
    backgroundOpacity: typeof o.backgroundOpacity === "number" ? o.backgroundOpacity : DEFAULT_HERO.backgroundOpacity,
  };
}

function sanitizeMarquee(raw: unknown): HomeMarquee {
  if (!isObject(raw)) return DEFAULT_MARQUEE;
  const items = Array.isArray(raw.items)
    ? raw.items.filter(isString).map((s) => s.trim()).filter(Boolean)
    : [];
  return { items: items.length ? items : DEFAULT_MARQUEE.items };
}

function sanitizeShowcase(raw: unknown): HomeShowcaseCopy {
  if (!isObject(raw)) return DEFAULT_SHOWCASE;
  const eyebrow = isString(raw.eyebrow) ? raw.eyebrow : DEFAULT_SHOWCASE.eyebrow;
  const title = isString(raw.title) ? raw.title : DEFAULT_SHOWCASE.title;
  const subtitle = isString(raw.subtitle) ? raw.subtitle : DEFAULT_SHOWCASE.subtitle;
  const viewAllLabel = isString(raw.viewAllLabel)
    ? raw.viewAllLabel
    : DEFAULT_SHOWCASE.viewAllLabel;
  const emptyLabel = isString(raw.emptyLabel)
    ? raw.emptyLabel
    : DEFAULT_SHOWCASE.emptyLabel;
  return { eyebrow, title, subtitle, viewAllLabel, emptyLabel };
}

function sanitizeWhyWali(raw: unknown): HomeWhyWali {
  if (!isObject(raw)) return DEFAULT_WHY_WALI;
  const items: HomeWhyWaliItem[] = Array.isArray(raw.items)
    ? raw.items
        .filter(isObject)
        .map((it) => ({
          title: isString(it.title) ? it.title : "",
          body: isString(it.body) ? it.body : "",
        }))
        .filter((it) => it.title || it.body)
    : [];
  return {
    eyebrow: isString(raw.eyebrow) ? raw.eyebrow : DEFAULT_WHY_WALI.eyebrow,
    title: isString(raw.title) ? raw.title : DEFAULT_WHY_WALI.title,
    subtitle: isString(raw.subtitle) ? raw.subtitle : DEFAULT_WHY_WALI.subtitle,
    items: items.length ? items : DEFAULT_WHY_WALI.items,
  };
}

function sanitizeHowToOrder(raw: unknown): HomeHowToOrder {
  if (!isObject(raw)) return DEFAULT_HOW_TO_ORDER;
  const steps: HomeHowToOrderStep[] = Array.isArray(raw.steps)
    ? raw.steps
        .filter(isObject)
        .map((it) => ({
          title: isString(it.title) ? it.title : "",
          body: isString(it.body) ? it.body : "",
        }))
        .filter((it) => it.title || it.body)
    : [];
  return {
    eyebrow: isString(raw.eyebrow) ? raw.eyebrow : DEFAULT_HOW_TO_ORDER.eyebrow,
    title: isString(raw.title) ? raw.title : DEFAULT_HOW_TO_ORDER.title,
    subtitle: isString(raw.subtitle) ? raw.subtitle : DEFAULT_HOW_TO_ORDER.subtitle,
    steps: steps.length ? steps : DEFAULT_HOW_TO_ORDER.steps,
  };
}

function sanitizeCta(raw: unknown): HomeCta {
  if (!isObject(raw)) return DEFAULT_CTA;
  return {
    eyebrow: isString(raw.eyebrow) ? raw.eyebrow : DEFAULT_CTA.eyebrow,
    title: isString(raw.title) ? raw.title : DEFAULT_CTA.title,
    subtitle: isString(raw.subtitle) ? raw.subtitle : DEFAULT_CTA.subtitle,
    primaryLabel: isString(raw.primaryLabel) ? raw.primaryLabel : DEFAULT_CTA.primaryLabel,
    primaryHref: isString(raw.primaryHref) ? raw.primaryHref : DEFAULT_CTA.primaryHref,
    secondaryLabel: isString(raw.secondaryLabel) ? raw.secondaryLabel : DEFAULT_CTA.secondaryLabel,
    secondaryHref: isString(raw.secondaryHref) ? raw.secondaryHref : DEFAULT_CTA.secondaryHref,
  };
}

function sanitizeFaq(raw: unknown): HomeFaq {
  if (!isObject(raw)) return DEFAULT_FAQ;
  const items: HomeFaqItem[] = Array.isArray(raw.items)
    ? raw.items
        .filter(isObject)
        .map((it) => ({
          q: isString(it.q) ? it.q : "",
          a: isString(it.a) ? it.a : "",
        }))
        .filter((it) => it.q || it.a)
    : [];
  return {
    eyebrow: isString(raw.eyebrow) ? raw.eyebrow : DEFAULT_FAQ.eyebrow,
    title: isString(raw.title) ? raw.title : DEFAULT_FAQ.title,
    subtitle: isString(raw.subtitle) ? raw.subtitle : DEFAULT_FAQ.subtitle,
    items: items.length ? items : DEFAULT_FAQ.items,
  };
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/** Get a single section by key. Returns sanitized object (never throws). */
export async function getHomeSection<K extends keyof HomeContent>(
  key: K
): Promise<HomeContent[K]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("home_content")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error(`getHomeSection(${key}) error:`, error.message);
      return getDefault(key);
    }
    return sanitizeSection(key, (data as { value: unknown } | null)?.value);
  } catch (err) {
    console.error(`getHomeSection(${key}) unexpected error:`, err);
    return getDefault(key);
  }
}

/** Get all sections in one query. */
export async function getAllHomeContent(): Promise<HomeContent> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("home_content").select("key, value");
    if (error) {
      console.error("getAllHomeContent error:", error.message);
      return {
        hero: DEFAULT_HERO,
        marquee: DEFAULT_MARQUEE,
        showcase: DEFAULT_SHOWCASE,
        why_wali: DEFAULT_WHY_WALI,
        how_to_order: DEFAULT_HOW_TO_ORDER,
        cta: DEFAULT_CTA,
        faq: DEFAULT_FAQ,
      };
    }
    const map: Record<string, unknown> = {};
    ((data ?? []) as { key: string; value: unknown }[]).forEach((r) => {
      map[r.key] = r.value;
    });
    return {
      hero: sanitizeHero(map.hero),
      marquee: sanitizeMarquee(map.marquee),
      showcase: sanitizeShowcase(map.showcase),
      why_wali: sanitizeWhyWali(map.why_wali),
      how_to_order: sanitizeHowToOrder(map.how_to_order),
      cta: sanitizeCta(map.cta),
      faq: sanitizeFaq(map.faq),
    };
  } catch (err) {
    console.error("getAllHomeContent unexpected error:", err);
    return {
      hero: DEFAULT_HERO,
      marquee: DEFAULT_MARQUEE,
      showcase: DEFAULT_SHOWCASE,
      why_wali: DEFAULT_WHY_WALI,
      how_to_order: DEFAULT_HOW_TO_ORDER,
      cta: DEFAULT_CTA,
      faq: DEFAULT_FAQ,
    };
  }
}

function getDefault<K extends keyof HomeContent>(key: K): HomeContent[K] {
  switch (key) {
    case "hero":
      return DEFAULT_HERO as HomeContent[K];
    case "marquee":
      return DEFAULT_MARQUEE as HomeContent[K];
    case "showcase":
      return DEFAULT_SHOWCASE as HomeContent[K];
    case "why_wali":
      return DEFAULT_WHY_WALI as HomeContent[K];
    case "how_to_order":
      return DEFAULT_HOW_TO_ORDER as HomeContent[K];
    case "cta":
      return DEFAULT_CTA as HomeContent[K];
    case "faq":
      return DEFAULT_FAQ as HomeContent[K];
  }
}

function sanitizeSection<K extends keyof HomeContent>(
  key: K,
  raw: unknown
): HomeContent[K] {
  switch (key) {
    case "hero":
      return sanitizeHero(raw) as HomeContent[K];
    case "marquee":
      return sanitizeMarquee(raw) as HomeContent[K];
    case "showcase":
      return sanitizeShowcase(raw) as HomeContent[K];
    case "why_wali":
      return sanitizeWhyWali(raw) as HomeContent[K];
    case "how_to_order":
      return sanitizeHowToOrder(raw) as HomeContent[K];
    case "cta":
      return sanitizeCta(raw) as HomeContent[K];
    case "faq":
      return sanitizeFaq(raw) as HomeContent[K];
  }
}

// -----------------------------------------------------------------------------
// Section keys — exported for admin form to render the right panel.
// -----------------------------------------------------------------------------
export const HOME_SECTION_KEYS = [
  "hero",
  "marquee",
  "showcase",
  "why_wali",
  "how_to_order",
  "cta",
  "faq",
] as const;

export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number];
