import "server-only";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type HeroCtaButton = {
  label: string;
  url: string;
};

export type HeroSettings = {
  enabled: boolean;
  badge: string;
  headlineTop: string;
  headlineHighlight: string;
  headlineBottom: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  secondaryCtaLabel: string;
  secondaryCtaUrl: string;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  backgroundType: "gradient" | "solid" | "image";
  backgroundColor: string;
  backgroundImageUrl: string;
  backgroundGradient: string;
  overlayOpacity: number;
  backgroundOpacity: number;
};

export type StatItem = { id: string; value: string; label: string };

export type TrustBadge = {
  id: string;
  text: string;
  icon: string;
  enabled: boolean;
};

export type WhyWaliItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type HowToOrderStep = {
  id: string;
  step: string;
  title: string;
  description: string;
};

export type FaqItem = { id: string; question: string; answer: string };

export type FooterLink = { id: string; label: string; url: string };

export type HeaderSettings = {
  logoUrl: string;
  logoText: string;
  logoSubtitle: string;
  showSubtitle: boolean;
  menuLabels: { home: string; products: string; trackOrder: string; cart: string };
  loginLabel: string;
  registerLabel: string;
  showLogin: boolean;
  showRegister: boolean;
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

export type SectionsSettings = {
  marquee: boolean;
  whyWali: boolean;
  howToOrder: boolean;
  cta: boolean;
  faq: boolean;
};

export type MarqueeSettings = { enabled: boolean; texts: string[] };

export type WhyWaliSettings = {
  enabled: boolean;
  title: string;
  description: string;
  items: WhyWaliItem[];
};

export type HowToOrderSettings = {
  enabled: boolean;
  title: string;
  description: string;
  steps: HowToOrderStep[];
};

export type CtaSettings = {
  enabled: boolean;
  title: string;
  description: string;
  primaryLabel: string;
  primaryUrl: string;
  secondaryLabel: string;
  secondaryUrl: string;
};

export type FaqSettings = {
  enabled: boolean;
  title: string;
  description: string;
  items: FaqItem[];
};

export type FooterSettings = {
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
  links: FooterLink[];
};

export type SeoSettings = {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
};

const HEADER_DEFAULTS: HeaderSettings = {
  logoUrl: "",
  logoText: "WALI",
  logoSubtitle: "Official Merchandise",
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

const HERO_DEFAULTS: HeroSettings = {
  enabled: true,
  badge: "Official WALI Merch · Pre-Order Sekarang",
  headlineTop: "WALI",
  headlineHighlight: "Merchandise",
  headlineBottom: "Resmi Untuk Fans Sejati",
  description:
    "Koleksi resmi WALI, dibuat dengan material premium, desain eksklusif, dan packaging yang aman. Tunjukkan dukunganmu untuk band legendaris dengan gaya.",
  primaryCtaLabel: "Belanja Sekarang",
  primaryCtaUrl: "/products",
  secondaryCtaLabel: "Lihat Track Order",
  secondaryCtaUrl: "/track-order",
  primaryButtonText: "Belanja Sekarang",
  primaryButtonUrl: "/products",
  secondaryButtonText: "Lihat Track Order",
  secondaryButtonUrl: "/track-order",
  backgroundType: "gradient",
  backgroundColor: "#0b0b0b",
  backgroundImageUrl: "",
  backgroundGradient:
    "radial-gradient(ellipse at top, rgba(215,255,83,0.20), transparent 60%), radial-gradient(ellipse at bottom right, rgba(123,97,255,0.25), transparent 60%)",
  overlayOpacity: 50,
  backgroundOpacity: 1,
};

const SECTIONS_DEFAULTS: SectionsSettings = {
  marquee: true,
  whyWali: true,
  howToOrder: true,
  cta: true,
  faq: true,
};

const MARQUEE_DEFAULTS: MarqueeSettings = {
  enabled: true,
  texts: [
    "Official WALI Merch",
    "100% Original",
    "Pengiriman Cepat",
    "Limited Drop",
  ],
};

const WHY_DEFAULTS: WhyWaliSettings = {
  enabled: true,
  title: "Kenapa WALI Merch?",
  description: "Koleksi merchandise resmi yang dibuat dengan detail, material premium, dan rasa hormat untuk fans.",
  items: [
    {
      id: "ww-1",
      title: "100% Original",
      description: "Setiap item diproduksi dengan standar tertinggi dan lisensi resmi WALI.",
      icon: "ShieldCheck",
    },
    {
      id: "ww-2",
      title: "Material Premium",
      description: "Cotton combed 30s, sablon DTF tahan lama, dan packaging rapi.",
      icon: "Sparkles",
    },
    {
      id: "ww-3",
      title: "Pengiriman Cepat",
      description: "Diproses 1-2 hari kerja, tracking real-time, packing aman.",
      icon: "Truck",
    },
    {
      id: "ww-4",
      title: "Garansi 30 Hari",
      description: "Cacat produksi? Kami ganti baru tanpa ribet.",
      icon: "BadgeCheck",
    },
  ],
};

const HOWTO_DEFAULTS: HowToOrderSettings = {
  enabled: true,
  title: "Cara Order",
  description: "Pesan merchandise WALI favoritmu hanya dalam 3 langkah mudah.",
  steps: [
    {
      id: "hto-1",
      step: "01",
      title: "Pilih Produk",
      description: "Telusuri koleksi dan pilih varian yang kamu suka.",
    },
    {
      id: "hto-2",
      step: "02",
      title: "Bayar via Midtrans",
      description: "Berbagai metode pembayaran: QRIS, VA, e-wallet, kartu kredit.",
    },
    {
      id: "hto-3",
      step: "03",
      title: "Pakai & Tampil Beda",
      description: "Paket sampai di rumahmu, siap dipakai untuk nonton bareng atau daily outfit.",
    },
  ],
};

const CTA_DEFAULTS: CtaSettings = {
  enabled: true,
  title: "Siap Tampil Beda Bareng WALI?",
  description: "Dapatkan koleksi merchandise resmi WALI sekarang juga.",
  primaryLabel: "Mulai Belanja",
  primaryUrl: "/products",
  secondaryLabel: "Pelajari Lebih Lanjut",
  secondaryUrl: "/about",
};

const FAQ_DEFAULTS: FaqSettings = {
  enabled: true,
  title: "Pertanyaan Umum",
  description: "Pertanyaan yang sering ditanyakan customer tentang WALI Merch.",
  items: [
    {
      id: "faq-1",
      question: "Apakah barang original?",
      answer: "Ya, semua merchandise WALI yang kami jual adalah original dan diproduksi dengan lisensi resmi.",
    },
    {
      id: "faq-2",
      question: "Berapa lama pengiriman?",
      answer: "Pesanan diproses 1-2 hari kerja. Pengiriman ke seluruh Indonesia 2-5 hari kerja tergantung lokasi.",
    },
    {
      id: "faq-3",
      question: "Apakah bisa COD?",
      answer: "Saat ini pembayaran hanya melalui Midtrans (QRIS, Virtual Account, e-wallet, kartu kredit).",
    },
  ],
};

const FOOTER_DEFAULTS: FooterSettings = {
  logoUrl: "",
  logoText: "WALI",
  brandDescription: "Official merchandise WALI. Dibuat untuk fans sejati.",
  address: "Jakarta, Indonesia",
  email: "cs@wali-merch.id",
  whatsapp: "+6281234567890",
  instagram: "",
  tiktok: "",
  youtube: "",
  copyrightText: "© 2026 WALI Official Merch. All rights reserved.",
  links: [
    { id: "l-1", label: "Home", url: "/" },
    { id: "l-2", label: "Products", url: "/products" },
    { id: "l-3", label: "Track Order", url: "/track-order" },
  ],
};

const LATEST_DEFAULTS: LatestDropSettings = {
  enabled: true,
  title: "Latest Drop",
  description: "Koleksi terbaru WALI. Dapatkan sebelum sold out.",
  ctaLabel: "Lihat Semua",
  ctaUrl: "/products",
  limit: 6,
  backgroundColor: "#0b0b0b",
  mode: "auto",
  manualProductIds: [],
};

const SEO_DEFAULTS: SeoSettings = {
  metaTitle: "WALI Official Merchandise",
  metaDescription: "Koleksi resmi merchandise WALI. Original, premium, limited.",
  ogTitle: "WALI Official Merchandise",
  ogDescription: "Koleksi resmi merchandise WALI. Original, premium, limited.",
  ogImage: "",
};

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function asBool(v: unknown, fallback = false): boolean {
  if (typeof v === "boolean") return v;
  if (v === "1" || v === "true" || v === "on") return true;
  return fallback;
}

function asNumber(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asString(v: unknown, fallback = ""): string {
  return isString(v) ? v : fallback;
}

function asArray<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function safeParseJson(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readRow(key: string): Promise<unknown> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) {
      console.error(`[homepageSettings] read '${key}' failed:`, error.message);
      return null;
    }
    const value = (data as { value: string | null } | null)?.value ?? null;
    if (!value) return null;
    return safeParseJson(value);
  } catch (err) {
    console.error(`[homepageSettings] read '${key}' unexpected:`, err);
    return null;
  }
}

export async function getHeaderSettings(): Promise<HeaderSettings> {
  const raw = await readRow("homepage_header");
  const obj = (raw ?? {}) as Record<string, unknown>;
  const labels = (obj.menuLabels ?? {}) as Record<string, unknown>;
  return {
    logoUrl: asString(obj.logoUrl, HEADER_DEFAULTS.logoUrl),
    logoText: asString(obj.logoText, HEADER_DEFAULTS.logoText),
    logoSubtitle: asString(obj.logoSubtitle, HEADER_DEFAULTS.logoSubtitle),
    showSubtitle: asBool(obj.showSubtitle, HEADER_DEFAULTS.showSubtitle),
    menuLabels: {
      home: asString(labels.home, HEADER_DEFAULTS.menuLabels.home),
      products: asString(labels.products, HEADER_DEFAULTS.menuLabels.products),
      trackOrder: asString(labels.trackOrder, HEADER_DEFAULTS.menuLabels.trackOrder),
      cart: asString(labels.cart, HEADER_DEFAULTS.menuLabels.cart),
    },
    loginLabel: asString(obj.loginLabel, HEADER_DEFAULTS.loginLabel),
    registerLabel: asString(obj.registerLabel, HEADER_DEFAULTS.registerLabel),
    showLogin: asBool(obj.showLogin, HEADER_DEFAULTS.showLogin),
    showRegister: asBool(obj.showRegister, HEADER_DEFAULTS.showRegister),
  };
}

export async function getHeroSettings(): Promise<HeroSettings> {
  const raw = await readRow("homepage_hero");
  const obj = (raw ?? {}) as Record<string, unknown>;
  const overlay = asNumber(obj.overlayOpacity, HERO_DEFAULTS.overlayOpacity);
  return {
    enabled: asBool(obj.enabled, HERO_DEFAULTS.enabled),
    badge: asString(obj.badge, HERO_DEFAULTS.badge),
    headlineTop: asString(obj.headlineTop, HERO_DEFAULTS.headlineTop),
    headlineHighlight: asString(obj.headlineHighlight, HERO_DEFAULTS.headlineHighlight),
    headlineBottom: asString(obj.headlineBottom, HERO_DEFAULTS.headlineBottom),
    description: asString(obj.description, HERO_DEFAULTS.description),
    primaryCtaLabel: asString(obj.primaryCtaLabel ?? obj.primaryButtonText, HERO_DEFAULTS.primaryCtaLabel),
    primaryCtaUrl: asString(obj.primaryCtaUrl ?? obj.primaryButtonUrl, HERO_DEFAULTS.primaryCtaUrl),
    secondaryCtaLabel: asString(obj.secondaryCtaLabel ?? obj.secondaryButtonText, HERO_DEFAULTS.secondaryCtaLabel),
    secondaryCtaUrl: asString(obj.secondaryCtaUrl ?? obj.secondaryButtonUrl, HERO_DEFAULTS.secondaryCtaUrl),
    primaryButtonText: asString(obj.primaryButtonText ?? obj.primaryCtaLabel, HERO_DEFAULTS.primaryButtonText),
    primaryButtonUrl: asString(obj.primaryButtonUrl ?? obj.primaryCtaUrl, HERO_DEFAULTS.primaryButtonUrl),
    secondaryButtonText: asString(obj.secondaryButtonText ?? obj.secondaryCtaLabel, HERO_DEFAULTS.secondaryButtonText),
    secondaryButtonUrl: asString(obj.secondaryButtonUrl ?? obj.secondaryCtaUrl, HERO_DEFAULTS.secondaryButtonUrl),
    backgroundType: (asString(obj.backgroundType, HERO_DEFAULTS.backgroundType) as HeroSettings["backgroundType"]),
    backgroundColor: asString(obj.backgroundColor, HERO_DEFAULTS.backgroundColor),
    backgroundImageUrl: asString(obj.backgroundImageUrl, HERO_DEFAULTS.backgroundImageUrl),
    backgroundGradient: asString(obj.backgroundGradient, HERO_DEFAULTS.backgroundGradient),
    overlayOpacity: overlay,
    backgroundOpacity: asNumber(obj.backgroundOpacity, overlay / 100),
  };
}

export async function getStatItems(): Promise<StatItem[]> {
  const raw = await readRow("homepage_stats");
  const arr = asArray<Record<string, unknown>>(raw);
  const items = arr
    .map((s, idx) => ({
      id: asString(s.id, `stat-${idx}`),
      value: asString(s.value),
      label: asString(s.label),
    }))
    .filter((s) => s.value && s.label)
    .slice(0, 12);
  return items;
}

export async function getTrustBadges(): Promise<TrustBadge[]> {
  const raw = await readRow("homepage_trust_badges");
  const arr = asArray<Record<string, unknown>>(raw);
  return arr
    .map((b, idx) => ({
      id: asString(b.id, `badge-${idx}`),
      text: asString(b.text),
      icon: asString(b.icon, "ShieldCheck"),
      enabled: asBool(b.enabled, true),
    }))
    .filter((b) => b.text)
    .slice(0, 12);
}

export async function getLatestDropSettings(): Promise<LatestDropSettings> {
  const raw = await readRow("homepage_latest_drop");
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    enabled: asBool(obj.enabled, LATEST_DEFAULTS.enabled),
    title: asString(obj.title, LATEST_DEFAULTS.title),
    description: asString(obj.description, LATEST_DEFAULTS.description),
    ctaLabel: asString(obj.ctaLabel, LATEST_DEFAULTS.ctaLabel),
    ctaUrl: asString(obj.ctaUrl, LATEST_DEFAULTS.ctaUrl),
    limit: asNumber(obj.limit, LATEST_DEFAULTS.limit),
    backgroundColor: asString(obj.backgroundColor, LATEST_DEFAULTS.backgroundColor),
    mode: (asString(obj.mode, LATEST_DEFAULTS.mode) as LatestDropSettings["mode"]),
    manualProductIds: asArray<string>(obj.manualProductIds)
      .map((id) => asString(id))
      .filter(Boolean)
      .slice(0, 50),
  };
}

export async function getSectionsSettings(): Promise<SectionsSettings> {
  const raw = await readRow("homepage_sections");
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    marquee: asBool(obj.marquee, SECTIONS_DEFAULTS.marquee),
    whyWali: asBool(obj.whyWali, SECTIONS_DEFAULTS.whyWali),
    howToOrder: asBool(obj.howToOrder, SECTIONS_DEFAULTS.howToOrder),
    cta: asBool(obj.cta, SECTIONS_DEFAULTS.cta),
    faq: asBool(obj.faq, SECTIONS_DEFAULTS.faq),
  };
}

export async function getMarqueeSettings(): Promise<MarqueeSettings> {
  const raw = await readRow("homepage_marquee");
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    enabled: asBool(obj.enabled, MARQUEE_DEFAULTS.enabled),
    texts: asArray<string>(obj.texts)
      .map((s) => asString(s))
      .filter(Boolean)
      .slice(0, 30),
  };
}

export async function getWhyWaliSettings(): Promise<WhyWaliSettings> {
  const raw = await readRow("homepage_why_wali");
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    enabled: asBool(obj.enabled, WHY_DEFAULTS.enabled),
    title: asString(obj.title, WHY_DEFAULTS.title),
    description: asString(obj.description, WHY_DEFAULTS.description),
    items: asArray<Record<string, unknown>>(obj.items)
      .map((it, idx) => ({
        id: asString(it.id, `ww-${idx}`),
        title: asString(it.title),
        description: asString(it.description),
        icon: asString(it.icon, "ShieldCheck"),
      }))
      .filter((it) => it.title)
      .slice(0, 8),
  };
}

export async function getHowToOrderSettings(): Promise<HowToOrderSettings> {
  const raw = await readRow("homepage_how_to_order");
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    enabled: asBool(obj.enabled, HOWTO_DEFAULTS.enabled),
    title: asString(obj.title, HOWTO_DEFAULTS.title),
    description: asString(obj.description, HOWTO_DEFAULTS.description),
    steps: asArray<Record<string, unknown>>(obj.steps)
      .map((s, idx) => ({
        id: asString(s.id, `hto-${idx}`),
        step: asString(s.step, ""),
        title: asString(s.title),
        description: asString(s.description),
      }))
      .filter((s) => s.title)
      .slice(0, 8),
  };
}

export async function getCtaSettings(): Promise<CtaSettings> {
  const raw = await readRow("homepage_cta");
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    enabled: asBool(obj.enabled, CTA_DEFAULTS.enabled),
    title: asString(obj.title, CTA_DEFAULTS.title),
    description: asString(obj.description, CTA_DEFAULTS.description),
    primaryLabel: asString(obj.primaryLabel, CTA_DEFAULTS.primaryLabel),
    primaryUrl: asString(obj.primaryUrl, CTA_DEFAULTS.primaryUrl),
    secondaryLabel: asString(obj.secondaryLabel, CTA_DEFAULTS.secondaryLabel),
    secondaryUrl: asString(obj.secondaryUrl, CTA_DEFAULTS.secondaryUrl),
  };
}

export async function getFaqSettings(): Promise<FaqSettings> {
  const raw = await readRow("homepage_faq");
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    enabled: asBool(obj.enabled, FAQ_DEFAULTS.enabled),
    title: asString(obj.title, FAQ_DEFAULTS.title),
    description: asString(obj.description, FAQ_DEFAULTS.description),
    items: asArray<Record<string, unknown>>(obj.items)
      .map((it, idx) => ({
        id: asString(it.id, `faq-${idx}`),
        question: asString(it.question),
        answer: asString(it.answer),
      }))
      .filter((it) => it.question && it.answer)
      .slice(0, 30),
  };
}

export async function getFooterSettings(): Promise<FooterSettings> {
  const raw = await readRow("homepage_footer");
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    logoUrl: asString(obj.logoUrl, FOOTER_DEFAULTS.logoUrl),
    logoText: asString(obj.logoText, FOOTER_DEFAULTS.logoText),
    brandDescription: asString(obj.brandDescription, FOOTER_DEFAULTS.brandDescription),
    address: asString(obj.address, FOOTER_DEFAULTS.address),
    email: asString(obj.email, FOOTER_DEFAULTS.email),
    whatsapp: asString(obj.whatsapp, FOOTER_DEFAULTS.whatsapp),
    instagram: asString(obj.instagram, FOOTER_DEFAULTS.instagram),
    tiktok: asString(obj.tiktok, FOOTER_DEFAULTS.tiktok),
    youtube: asString(obj.youtube, FOOTER_DEFAULTS.youtube),
    copyrightText: asString(obj.copyrightText, FOOTER_DEFAULTS.copyrightText),
    links: asArray<Record<string, unknown>>(obj.links)
      .map((l, idx) => ({
        id: asString(l.id, `l-${idx}`),
        label: asString(l.label),
        url: asString(l.url),
      }))
      .filter((l) => l.label && l.url)
      .slice(0, 12),
  };
}

export async function getSeoSettings(): Promise<SeoSettings> {
  const raw = await readRow("homepage_seo");
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    metaTitle: asString(obj.metaTitle, SEO_DEFAULTS.metaTitle),
    metaDescription: asString(obj.metaDescription, SEO_DEFAULTS.metaDescription),
    ogTitle: asString(obj.ogTitle, SEO_DEFAULTS.ogTitle),
    ogDescription: asString(obj.ogDescription, SEO_DEFAULTS.ogDescription),
    ogImage: asString(obj.ogImage, SEO_DEFAULTS.ogImage),
  };
}

export async function getHomepageSettings() {
  return {
    header: await getHeaderSettings(),
    hero: await getHeroSettings(),
    stats: await getStatItems(),
    trustBadges: await getTrustBadges(),
    latestDrop: await getLatestDropSettings(),
    sections: await getSectionsSettings(),
    marquee: await getMarqueeSettings(),
    whyWali: await getWhyWaliSettings(),
    howToOrder: await getHowToOrderSettings(),
    cta: await getCtaSettings(),
    faq: await getFaqSettings(),
    footer: await getFooterSettings(),
    seo: await getSeoSettings(),
  };
}

export const HOMEPAGE_DEFAULTS = {
  HEADER: HEADER_DEFAULTS,
  HERO: HERO_DEFAULTS,
  SECTIONS: SECTIONS_DEFAULTS,
  MARQUEE: MARQUEE_DEFAULTS,
  WHY: WHY_DEFAULTS,
  HOWTO: HOWTO_DEFAULTS,
  CTA: CTA_DEFAULTS,
  FAQ: FAQ_DEFAULTS,
  FOOTER: FOOTER_DEFAULTS,
  LATEST: LATEST_DEFAULTS,
  SEO: SEO_DEFAULTS,
};
