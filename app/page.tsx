import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroAurora from "@/components/home/HeroAurora";
import Marquee from "@/components/home/Marquee";
import ProductShowcase from "@/components/home/ProductShowcase";
import WhyWali from "@/components/home/WhyWali";
import HowToOrder from "@/components/home/HowToOrder";
import CtaSection from "@/components/home/CtaSection";
import Faq from "@/components/home/Faq";
import { getHomepageSettings } from "@/lib/storeSettings";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import SectionNav from "@/components/SectionNav";

type ShowProduct = {
  id: string;
  name: string;
  price: number;
  tag?: string;
  category?: string;
  slug?: string;
  description?: string;
  image?: string;
  product_images?: { image_url: string }[];
  product_variants?: { size?: string; stock?: number }[];
};

/**
 * Fetch latest-drop products from the database according to the
 * current latest-drop settings (auto vs manual mode).
 */
async function fetchLatestDropProducts(limit: number) {
  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("*, product_images(*), product_variants(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !products) return [];

  return (products as Array<Record<string, unknown>>).map((row) => {
    const tags = (row.tags as string[] | undefined) ?? [];
    const firstTag = tags[0];
    return {
      id: String(row.id),
      name: String(row.name),
      price: Number(row.price) || 0,
      tag: firstTag || undefined,
      category: String(row.category) || undefined,
      slug: String(row.slug),
      description: String(row.short_description ?? row.description ?? ""),
      product_images: (row.product_images as Array<{ image_url: string }>)?.length
        ? (row.product_images as Array<{ image_url: string }>)
        : undefined,
      product_variants: (row.product_variants as Array<{ size?: string; stock?: number }>)?.length
        ? (row.product_variants as Array<{ size?: string; stock?: number }>)
        : undefined,
    };
  });
}

/**
 * Fetch manual latest-drop products by ID order.
 * `ids` must be a non-empty array.
 */
async function fetchManualLatestDropProducts(ids: string[]) {
  if (ids.length === 0) return [];

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("*, product_images(*), product_variants(*)")
    .in("id", ids);

  if (error || !products) return [];

  // Build a map of admin-set position so we can preserve order after mapping.
  const adminOrder = new Map(ids.map((id, i) => [id, i]));

  const mapped = (products as Array<Record<string, unknown>>).map((row) => {
    const tags = (row.tags as string[] | undefined) ?? [];
    const firstTag = tags[0];
    return {
      id: String(row.id),
      name: String(row.name),
      price: Number(row.price) || 0,
      tag: firstTag || undefined,
      category: String(row.category) || undefined,
      slug: String(row.slug),
      description: String(row.short_description ?? row.description ?? ""),
      product_images: (row.product_images as Array<{ image_url: string }>)?.length
        ? (row.product_images as Array<{ image_url: string }>)
        : undefined,
      product_variants: (row.product_variants as Array<{ size?: string; stock?: number }>)?.length
        ? (row.product_variants as Array<{ size?: string; stock?: number }>)
        : undefined,
    };
  });

  // Sort by admin-set order (unknown ids get pushed to the end).
  mapped.sort((a, b) => {
    const ai = adminOrder.get(a.id);
    const bi = adminOrder.get(b.id);
    if (ai !== undefined && bi !== undefined) return ai - bi;
    if (ai !== undefined) return -1;
    if (bi !== undefined) return 1;
    return 0;
  });
  return mapped;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const home = await getHomepageSettings();

  const heroContent = {
    badge: home.hero.badge,
    badgePill: home.hero.badgeLeft ?? home.hero.badge,
    headlineLine1: home.hero.headlineTop,
    headlineLine2a: home.hero.headlineHighlight,
    headlineLine2b: home.hero.headlineBottom,
    subheadline: home.hero.description,
    primaryCtaLabel: home.hero.primaryCtaLabel,
    primaryCtaHref: home.hero.primaryCtaUrl,
    secondaryCtaLabel: home.hero.secondaryCtaLabel,
    secondaryCtaHref: home.hero.secondaryCtaUrl,
    stat1Value: "—",
    stat1Label: "—",
    stat2Value: "—",
    stat2Label: "—",
    stat3Value: "—",
    stat3Label: "—",
    trust1: "—",
    trust2: "—",
    trust3: "—",
    backgroundType: home.hero.backgroundType,
    backgroundColor: home.hero.backgroundColor,
    backgroundImageUrl: home.hero.backgroundImageUrl,
    backgroundGradient: home.hero.backgroundGradient,
    backgroundOverlay: home.hero.overlayOpacity,
    backgroundOpacity: home.hero.backgroundOpacity,
  };

  const enabledBadges = (home.trustBadges ?? []).filter(
    (b) => b.enabled !== false && b.text
  );
  const finalStats = (home.stats ?? []).filter((s) => s.value && s.label);

  // — Latest-drop products —
  let latestDropProducts: ShowProduct[] = [];
  if (home.latestDrop.enabled && home.latestDrop.limit > 0) {
    if (home.latestDrop.mode === "manual" && home.latestDrop.manualProductIds.length > 0) {
      latestDropProducts = await fetchManualLatestDropProducts(
        home.latestDrop.manualProductIds.slice(0, home.latestDrop.limit)
      );
    } else {
      latestDropProducts = await fetchLatestDropProducts(home.latestDrop.limit);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">
      <Navbar />

      {home.hero.enabled && (
        <HeroAurora
          content={heroContent}
          stats={finalStats}
          trustBadges={enabledBadges}
        />
      )}

      {home.sections.marquee && home.marqueeSection.enabled && (
        <Marquee items={home.marqueeSection.texts} />
      )}

      {home.latestDrop.enabled && latestDropProducts.length > 0 && (
        <ProductShowcase
          products={latestDropProducts}
          description={home.latestDrop.description}
          ctaLabel={home.latestDrop.ctaLabel}
          ctaUrl={home.latestDrop.ctaUrl}
          backgroundColor={home.latestDrop.backgroundColor}
        />
      )}

      {home.sections.whyWali && home.whyWaliSection.enabled && (
        <WhyWali />
      )}

      {home.sections.howToOrder && home.howToOrderSection.enabled && (
        <HowToOrder />
      )}

      {home.sections.cta && home.ctaSection.enabled && (
        <CtaSection />
      )}

      {home.sections.faq && home.faqSection.enabled && (
        <Faq />
      )}

      <Footer />

      <SectionNav />

      {/* SEO meta — read by app/layout.tsx via cookies? fallback below */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: home.seo.metaTitle,
            description: home.seo.metaDescription,
          }),
        }}
      />
    </main>
  );
}
