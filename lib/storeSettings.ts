import { getSupabaseAdmin } from "./supabaseAdmin";

// ============================================================
// Types — single source of truth for the homepage settings shape.
// Falls back to DEFAULT_* if the row is missing or unparsable.
// ============================================================

export type StoreGeneralSettings = {
  storeName: string;
  storeWhatsapp: string;
  storeEmail: string;
  storeAddress: string;
  lowStockThreshold: number;
  privacyPolicy: string;
  termsOfService: string;
};

export type HeaderSettings = {
  logoUrl: string;
  logoText: string;
  logoSubtitle: string;
  showSubtitle: boolean;
  menuLabels: {
    home: string;
    products: string;
    trackOrder: string;
    cart: string;
  };
  loginLabel: string;
  registerLabel: string;
  showLogin: boolean;
  showRegister: boolean;
};

export type HeroSettings = {
  enabled: boolean;
  /**
   * Single badge string. Use " • " (or newlines) to separate segments;
   * the consumer splits on "•" and renders each as a chip.
   */
  badge: string;
  /** Convenience mirrors of `badge` split on "•" — read-only for the
   *  consumer. Stored in the same JSON row. */
  badgeLeft: string;
  badgeRight: string;
  headlineTop: string;
  headlineHighlight: string;
  headlineBottom: string;
  description: string;
  // CTA buttons. The form uses "Cta" naming; we expose both the new
  // and legacy button fields so older callers (and stale rows) still
  // compile.
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  secondaryCtaLabel: string;
  secondaryCtaUrl: string;
  // Legacy aliases — used by the original consumer. Mirrored on save.
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  /**
   * Background rendering mode.
   *   "gradient" — original aurora look (default; layers blobs).
   *   "solid"    — flat solid color.
   *   "image"    — custom uploaded/hosted image.
   */
  backgroundType: "gradient" | "solid" | "image";
  backgroundColor: string;
  /** Public URL of the uploaded background image (when type=image). */
  backgroundImageUrl: string;
  /** Optional CSS gradient string used when type=gradient. */
  backgroundGradient: string;
  /**
   * Overlay opacity 0..100 used when `backgroundType === "image"`.
   * The form stores 0..100 (whole numbers) and the consumer renders
   * the alpha at that value.
   */
  overlayOpacity: number;
  /** Legacy alias used by the older consumer. Mirrored on save. */
  backgroundOpacity: number;
};

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

export type LatestDropSettings = {
  enabled: boolean;
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  limit: number;
  backgroundColor: string;
  mode: "auto" | "manual";
  manualProductIds: string[];
};

export type HomepageFooterSettings = {
  logoUrl: string;
  logoText: string;
  brandDescription: string;
  address: string;
  email: string;
  whatsapp: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  copyrightText: string;
  links: { id: string; label: string; url: string }[];
};

export type HomepageSeoSettings = {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
};

export type HomepageSectionsSettings = {
  marquee: boolean;
  whyWali: boolean;
  howToOrder: boolean;
  cta: boolean;
  faq: boolean;
};

// Per-section settings objects (toggle + content). These are what the
// home components consume; the boolean `HomepageSectionsSettings` above
// is a lightweight toggle summary that mirrors each section's `enabled`.

export type MarqueeSectionSettings = {
  enabled: boolean;
  texts: string[];
};

export type WhyWaliItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type WhyWaliSectionSettings = {
  enabled: boolean;
  title: string;
  description: string;
  items: WhyWaliItem[];
};

export type HowToOrderStep = {
  id: string;
  step: string;
  title: string;
  description: string;
};

export type HowToOrderSectionSettings = {
  enabled: boolean;
  title: string;
  description: string;
  steps: HowToOrderStep[];
};

export type CtaSectionSettings = {
  enabled: boolean;
  title: string;
  description: string;
  primaryLabel: string;
  primaryUrl: string;
  secondaryLabel: string;
  secondaryUrl: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqSectionSettings = {
  enabled: boolean;
  title: string;
  description: string;
  items: FaqItem[];
};

// ============================================================
// Defaults — current production copy of the homepage. Used as
// fallback when the DB row is missing or unparsable. Keep these
// strings in sync with the hard-coded content in the components
// they replace.
// ============================================================

export const DEFAULT_SECTIONS: HomepageSectionsSettings = {
  marquee: true,
  whyWali: true,
  howToOrder: true,
  cta: true,
  faq: true,
};

export const DEFAULT_GENERAL: StoreGeneralSettings = {
  storeName: "WALI Merch",
  storeWhatsapp: "",
  storeEmail: "",
  storeAddress: "",
  lowStockThreshold: 5,
  privacyPolicy: "",
  termsOfService: "",
};

export const DEFAULT_HEADER: HeaderSettings = {
  logoUrl: "",
  logoText: "Official Merchandise Wali",
  logoSubtitle: "by wakalima",
  showSubtitle: true,
  menuLabels: {
    home: "Home",
    products: "Products",
    trackOrder: "Track Order",
    cart: "Cart",
  },
  loginLabel: "Login",
  registerLabel: "Daftar",
  showLogin: true,
  showRegister: true,
};

export const DEFAULT_HERO: HeroSettings = {
  enabled: true,
  badge: "Live · Drop 2026 Active",
  badgeLeft: "Live · Drop 2026 Active",
  badgeRight: "JKT",
  headlineTop: "Wear The",
  headlineHighlight: "Stage",
  headlineBottom: "Energy",
  description:
    "Apparel resmi untuk panggung. Limited capsule, material premium, checkout aman via Midtrans.",
  // New (form) fields
  primaryCtaLabel: "Shop Collection",
  primaryCtaUrl: "/products",
  secondaryCtaLabel: "Track Order",
  secondaryCtaUrl: "/track-order",
  // Legacy aliases mirrored
  primaryButtonText: "Shop Collection",
  primaryButtonUrl: "/products",
  secondaryButtonText: "Track Order",
  secondaryButtonUrl: "/track-order",
  backgroundType: "image",
  backgroundColor: "#0b0b0b",
  backgroundImageUrl: "/cta/wali-singapura.webp",
  backgroundGradient: "",
  overlayOpacity: 50,
  backgroundOpacity: 0.5,
};

export const DEFAULT_STATS: HomepageStat[] = [
  { id: "stat-pieces", value: "2.400+", label: "PIECES SHIPPED" },
  { id: "stat-official", value: "100%", label: "OFFICIAL" },
  { id: "stat-process", value: "1–2d", label: "PROCESS" },
];

export const DEFAULT_TRUST_BADGES: TrustBadge[] = [
  { id: "badge-warranty", text: "Garansi resmi", icon: "shield", enabled: true },
  { id: "badge-midtrans", text: "Midtrans secured checkout", icon: "lock", enabled: true },
  { id: "badge-limited", text: "Limited capsule", icon: "sparkles", enabled: true },
];

export const DEFAULT_LATEST_DROP: LatestDropSettings = {
  enabled: true,
  title: "Latest Drop",
  description: "Pieces paling baru dari WALI.",
  ctaLabel: "Lihat semua",
  ctaUrl: "/products",
  limit: 6,
  backgroundColor: "#0b0b0b",
  mode: "auto",
  manualProductIds: [],
};

export const DEFAULT_MARQUEE: MarqueeSectionSettings = {
  enabled: true,
  texts: [
    "OFFICIAL DROP",
    "LIMITED CAPSULE",
    "STAGE READY",
    "NEW SS/26",
  ],
};

export const DEFAULT_WHY_WALI: WhyWaliSectionSettings = {
  enabled: true,
  title: "Why WALI",
  description:
    "Setiap piece dibuat dengan detail panggung — dari fit, material, sampai kontrol kualitas.",
  items: [
    {
      id: "ww-1",
      title: "Official Merch",
      description: "Garansi resmi merch WALI.",
      icon: "shield",
    },
    {
      id: "ww-2",
      title: "Limited Capsule",
      description: "Editions terbatas, sekali jalan.",
      icon: "flame",
    },
    {
      id: "ww-3",
      title: "Stage-grade Material",
      description: "Material yang sama dipakai di panggung.",
      icon: "sparkles",
    },
    {
      id: "ww-4",
      title: "Midtrans Secured",
      description: "Checkout aman via Midtrans.",
      icon: "lock",
    },
  ],
};

export const DEFAULT_HOW_TO_ORDER: HowToOrderSectionSettings = {
  enabled: true,
  title: "How to Order",
  description: "Empat langkah mudah dari checkout sampai di panggungmu.",
  steps: [
    {
      id: "hto-1",
      step: "01",
      title: "Pilih item",
      description: "Browse koleksi dan pilih ukuran favoritmu.",
    },
    {
      id: "hto-2",
      step: "02",
      title: "Checkout",
      description: "Isi alamat dan pilih pembayaran via Midtrans.",
    },
    {
      id: "hto-3",
      step: "03",
      title: "Diproses",
      description: "Pesanan diproses dalam 1–2 hari kerja.",
    },
    {
      id: "hto-4",
      step: "04",
      title: "Dikirim",
      description: "Resi otomatis masuk dan bisa di-track.",
    },
  ],
};

export const DEFAULT_CTA: CtaSectionSettings = {
  enabled: true,
  title: "Siap naik panggung?",
  description: "Checkout sekarang, atau track pesananmu yang sudah jalan.",
  primaryLabel: "Shop Collection",
  primaryUrl: "/products",
  secondaryLabel: "Track Order",
  secondaryUrl: "/track-order",
};

export const DEFAULT_FAQ: FaqSectionSettings = {
  enabled: true,
  title: "FAQ",
  description: "Pertanyaan yang sering ditanyakan customer WALI.",
  items: [
    {
      id: "faq-1",
      question: "Berapa lama pesanan diproses?",
      answer: "1–2 hari kerja setelah pembayaran berhasil.",
    },
    {
      id: "faq-2",
      question: "Apakah ada garansi?",
      answer: "Ya, semua item official merch bergaransi resmi.",
    },
    {
      id: "faq-3",
      question: "Bagaimana cara track pesanan?",
      answer: "Gunakan menu Track Order dengan nomor order dan email.",
    },
  ],
};

export const DEFAULT_FOOTER: HomepageFooterSettings = {
  logoUrl: "",
  logoText: "WALI",
  brandDescription:
    "Official merchandise untuk komunitas panggung. Limited capsule, dibuat dengan material premium.",
  address: "",
  email: "",
  whatsapp: "",
  instagram: "",
  tiktok: "",
  youtube: "",
  copyrightText: "© {year} WALI Merch. All rights reserved.",
  links: [
    { id: "link-products", label: "Products", url: "/products" },
    { id: "link-track", label: "Track Order", url: "/track-order" },
    { id: "link-faq", label: "FAQ", url: "/faq" },
  ],
};

export const DEFAULT_SEO: HomepageSeoSettings = {
  metaTitle: "WALI Official Merchandise — Apparel Panggung",
  metaDescription:
    "WALI Merch — apparel resmi untuk panggung. Limited capsule, material premium, checkout aman via Midtrans.",
  ogTitle: "WALI Official Merchandise",
  ogDescription:
    "Apparel resmi WALI. Edisi terbatas, dibuat untuk panggung.",
  ogImage: "",
};

// ============================================================
// Generic store_settings row access (back-compat).
// ============================================================

export type StoreSettings = StoreGeneralSettings & {
  termsOfService: string;
};

export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_settings")
      .select("key, value")
      .in("key", [
        "store_name",
        "store_whatsapp",
        "store_email",
        "store_address",
        "low_stock_threshold",
        "privacy_policy",
        "terms_of_service",
      ]);
    if (error) {
      console.error("getStoreSettings error:", error.message);
      return DEFAULT_GENERAL as StoreSettings;
    }
    const map: Record<string, string> = {};
    (data ?? []).forEach((row: any) => {
      if (typeof row.value === "string") map[row.key] = row.value;
    });
    const thresholdRaw = map.low_stock_threshold;
    const thresholdNum = thresholdRaw ? Number(thresholdRaw) : NaN;
    return {
      storeName: map.store_name || DEFAULT_GENERAL.storeName,
      storeWhatsapp: map.store_whatsapp || "",
      storeEmail: map.store_email || "",
      storeAddress: map.store_address || "",
      lowStockThreshold: Number.isFinite(thresholdNum)
        ? Math.max(0, Math.min(999, Math.trunc(thresholdNum)))
        : DEFAULT_GENERAL.lowStockThreshold,
      privacyPolicy: map.privacy_policy || "",
      termsOfService: map.terms_of_service || "",
    };
  } catch (err) {
    console.error("getStoreSettings unexpected error");
    return DEFAULT_GENERAL as StoreSettings;
  }
}

// ============================================================
// Per-group JSON reader. Falls back to DEFAULT_* on any failure.
// Public — does NOT require admin session, uses the service-role
// client configured in lib/supabaseAdmin (server-only).
// ============================================================

type RawRow = { key: string; value: string | null };

// Track keys we have already attempted (and failed or succeeded) to
// auto-seed during the lifetime of this server process. Prevents the
// same upsert being retried on every request after the first failure
// (e.g. RLS blocking the write), which would otherwise spam logs and
// add pointless DB load. Cleared on server restart.
const seedAttempted = new Set<string>();

// Keys that should NEVER be auto-seeded. The homepage_* keys are
// orphaned by the admin-settings refactor; querying them only spams
// logs. Add new entries here if a row is intentionally absent in DB.
const SEED_BLOCKLIST = new Set<string>([
  "homepage_header",
  "homepage_hero",
  "homepage_marquee",
  "homepage_why_wali",
  "homepage_how_to_order",
  "homepage_cta",
  "homepage_faq",
  "homepage_footer",
  "homepage_sections",
  "homepage_seo",
  "homepage_latest_drop",
]);

// Quiet keys we have already complained about once. After the first
// "no row found" log for a given key, further misses are silent.
const warnedKeys = new Set<string>();

async function seedStoreSettingsRow(key: string, fallback: unknown) {
  try {
    const supabase = getSupabaseAdmin();
    const value = JSON.stringify(fallback);

    // Step 1: see whether the row already exists. If yes AND its value
    // is non-null, we leave it alone — admin-set values must never be
    // clobbered. If no row, or row exists with a NULL value, write the
    // default.
    const { data: existing } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (existing && (existing as RawRow).value) {
      // Admin already configured this row — do not touch.
      return;
    }

    if (existing) {
      // Row exists but value is NULL — update in place.
      const { error } = await supabase
        .from("store_settings")
        .update({ value })
        .eq("key", key);
      if (error) {
        console.warn(
          `readJsonRow(${key}) auto-seed update skipped:`,
          error.message
        );
      } else {
        console.log(`readJsonRow(${key}) auto-seeded NULL value`);
      }
    } else {
      // Row missing — insert.
      const { error } = await supabase
        .from("store_settings")
        .insert({ key, value });
      if (error) {
        console.warn(
          `readJsonRow(${key}) auto-seed insert skipped:`,
          error.message
        );
      } else {
        console.log(`readJsonRow(${key}) auto-seeded missing row`);
      }
    }
  } catch (err) {
    console.error(`readJsonRow(${key}) auto-seed error:`, err);
  } finally {
    seedAttempted.add(key);
  }
}

async function readJsonRow<T>(key: string, fallback: T): Promise<T> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_settings")
      .select("key, value")
      .eq("key", key)
      .maybeSingle();
    if (error) {
      console.error(`readJsonRow(${key}) error:`, error.message);
      return fallback;
    }
    if (!data) {
      // Self-heal: production DB is missing this row. Insert it with
      // the in-code default so future requests hit the cached row.
      // Blocklisted keys (orphaned by settings refactor) skip the
      // seed AND stay quiet on subsequent misses.
      if (SEED_BLOCKLIST.has(key)) {
        if (!warnedKeys.has(key)) {
          console.log(`readJsonRow(${key}) blocklisted, using fallback`);
          warnedKeys.add(key);
        }
      } else if (!seedAttempted.has(key)) {
        await seedStoreSettingsRow(key, fallback);
      } else if (!warnedKeys.has(key)) {
        console.warn(
          `readJsonRow(${key}) no row found, using fallback (seed already attempted this process)`
        );
        warnedKeys.add(key);
      }
      return fallback;
    }
    const raw = (data as RawRow).value;
    if (!raw) {
      if (!warnedKeys.has(key)) {
        console.warn(`readJsonRow(${key}) value is null/empty, using fallback`);
        warnedKeys.add(key);
      }
      return fallback;
    }
    const parsed = JSON.parse(raw);
    const result = { ...fallback, ...parsed } as T;
    return result;
  } catch (err) {
    console.error(`readJsonRow(${key}) parse error:`, err);
    return fallback;
  }
}

async function readJsonArrayRow<T extends { id: string }>(
  key: string,
  fallback: T[]
): Promise<T[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_settings")
      .select("key, value")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return fallback;
    const raw = (data as RawRow).value;
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    return parsed as T[];
  } catch (err) {
    console.error(`readJsonArrayRow(${key}) error:`, err);
    return fallback;
  }
}

export async function getHeaderSettings(): Promise<HeaderSettings> {
  // Always enforce the canonical header text regardless of stale DB values.
  return {
    ...(await readJsonRow<HeaderSettings>("homepage_header", DEFAULT_HEADER)),
    logoText: DEFAULT_HEADER.logoText,
    logoSubtitle: DEFAULT_HEADER.logoSubtitle,
  };
}

export async function getHeroSettings(): Promise<HeroSettings> {
  return readJsonRow<HeroSettings>("homepage_hero", DEFAULT_HERO);
}

export async function getStatsSettings(): Promise<HomepageStat[]> {
  return readJsonArrayRow<HomepageStat>("homepage_stats", DEFAULT_STATS);
}

export async function getTrustBadgesSettings(): Promise<TrustBadge[]> {
  return readJsonArrayRow<TrustBadge>(
    "homepage_trust_badges",
    DEFAULT_TRUST_BADGES
  );
}

export async function getLatestDropSettings(): Promise<LatestDropSettings> {
  return readJsonRow<LatestDropSettings>(
    "homepage_latest_drop",
    DEFAULT_LATEST_DROP
  );
}

export async function getHomepageSectionsSettings(): Promise<HomepageSectionsSettings> {
  return readJsonRow<HomepageSectionsSettings>(
    "homepage_sections",
    DEFAULT_SECTIONS
  );
}

export async function getHomepageFooterSettings(): Promise<HomepageFooterSettings> {
  return readJsonRow<HomepageFooterSettings>("homepage_footer", DEFAULT_FOOTER);
}

export async function getHomepageSeoSettings(): Promise<HomepageSeoSettings> {
  return readJsonRow<HomepageSeoSettings>("homepage_seo", DEFAULT_SEO);
}

// Aggregate — convenient for components that need everything.
export async function getAllHomepageSettings() {
  const [
    header,
    hero,
    stats,
    trustBadges,
    latestDrop,
    sections,
    footer,
    seo,
    general,
  ] = await Promise.all([
    getHeaderSettings(),
    getHeroSettings(),
    getStatsSettings(),
    getTrustBadgesSettings(),
    getLatestDropSettings(),
    getHomepageSectionsSettings(),
    getHomepageFooterSettings(),
    getHomepageSeoSettings(),
    getStoreSettings(),
  ]);
  return { header, hero, stats, trustBadges, latestDrop, sections, footer, seo, general };
}

// ============================================================
// Per-section content getters (toggle + body). Used by home
// components that need editable copy, not just a visibility flag.
// Falls back to DEFAULT_* constants on any DB/JSON error.
// ============================================================

export async function getMarqueeSectionSettings(): Promise<MarqueeSectionSettings> {
  return readJsonRow<MarqueeSectionSettings>("homepage_marquee", DEFAULT_MARQUEE);
}

export async function getWhyWaliSectionSettings(): Promise<WhyWaliSectionSettings> {
  return readJsonRow<WhyWaliSectionSettings>("homepage_why_wali", DEFAULT_WHY_WALI);
}

export async function getHowToOrderSectionSettings(): Promise<HowToOrderSectionSettings> {
  return readJsonRow<HowToOrderSectionSettings>(
    "homepage_how_to_order",
    DEFAULT_HOW_TO_ORDER
  );
}

export async function getCtaSectionSettings(): Promise<CtaSectionSettings> {
  return readJsonRow<CtaSectionSettings>("homepage_cta", DEFAULT_CTA);
}

export async function getFaqSectionSettings(): Promise<FaqSectionSettings> {
  return readJsonRow<FaqSectionSettings>("homepage_faq", DEFAULT_FAQ);
}

// ============================================================
// Aggregate used by `app/page.tsx`. Combines every section so the
// homepage only needs to call one server-side helper.
// Each section is gated by its toggle from `HomepageSectionsSettings`,
// and the section's own `enabled` flag is honored by the components.
// ============================================================
export type HomepageSettings = {
  header: HeaderSettings;
  hero: HeroSettings;
  stats: HomepageStat[];
  trustBadges: TrustBadge[];
  latestDrop: LatestDropSettings;
  // Section toggles (mirrors `sections.*` booleans for convenience).
  sections: HomepageSectionsSettings;
  // Per-section content (each has its own `enabled` flag).
  marqueeSection: MarqueeSectionSettings;
  whyWaliSection: WhyWaliSectionSettings;
  howToOrderSection: HowToOrderSectionSettings;
  ctaSection: CtaSectionSettings;
  faqSection: FaqSectionSettings;
  footer: HomepageFooterSettings;
  seo: HomepageSeoSettings;
  general: StoreSettings;
};

export async function getHomepageSettings(): Promise<HomepageSettings> {
  const [
    header,
    hero,
    stats,
    trustBadges,
    latestDrop,
    sections,
    footer,
    seo,
    general,
    marqueeSection,
    whyWaliSection,
    howToOrderSection,
    ctaSection,
    faqSection,
  ] = await Promise.all([
    getHeaderSettings(),
    getHeroSettings(),
    getStatsSettings(),
    getTrustBadgesSettings(),
    getLatestDropSettings(),
    getHomepageSectionsSettings(),
    getHomepageFooterSettings(),
    getHomepageSeoSettings(),
    getStoreSettings(),
    getMarqueeSectionSettings(),
    getWhyWaliSectionSettings(),
    getHowToOrderSectionSettings(),
    getCtaSectionSettings(),
    getFaqSectionSettings(),
  ]);
  return {
    header,
    hero,
    stats,
    trustBadges,
    latestDrop,
    sections,
    marqueeSection,
    whyWaliSection,
    howToOrderSection,
    ctaSection,
    faqSection,
    footer,
    seo,
    general,
  };
}
