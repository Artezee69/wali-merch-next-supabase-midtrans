import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroCarousel from "@/components/home/HeroCarousel";
import PromoBanner from "@/components/home/PromoBanner";
import Marquee from "@/components/home/Marquee";
import ProductShowcase from "@/components/home/ProductShowcase";
import HowToOrder from "@/components/home/HowToOrder";
import CtaSection from "@/components/home/CtaSection";
import Faq from "@/components/home/Faq";
import { getHomepageSettings } from "@/lib/storeSettings";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getActiveBannersByPosition } from "@/lib/banners";
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

  // — Banner DB (hero + promo kanan atas/bawah) —
  const [heroBanners, promoTop, promoBottom] = await Promise.all([
    getActiveBannersByPosition("hero"),
    getActiveBannersByPosition("right_top"),
    getActiveBannersByPosition("right_bottom"),
  ]);
  const promoTopBanner = promoTop[0] ?? null;
  const promoBottomBanner = promoBottom[0] ?? null;
  const hasPromos = !!(promoTopBanner || promoBottomBanner);

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
    <main className="min-h-screen">
      <Navbar />

      {heroBanners.length > 0 && (
        <section className="px-6 pt-8">
          <div
            className={`max-w-[1320px] mx-auto ${
              hasPromos
                ? "grid grid-cols-[1.6fr_1fr] items-start gap-6 rounded-xl overflow-hidden"
                : ""
            }`}
          >
            <HeroCarousel banners={heroBanners} fillHeight={hasPromos} className={hasPromos ? "h-[520px]" : ""} />
{(() => {
  // Render promos jika data tersedia, atau fallback placeholder jika tidak ada
  const renderPlaceholder = () => (
    <div className="h-[248px] rounded-xl border border-black/10 dark:border-white/10 bg-gray-900/10 dark:bg-white/5 overflow-hidden flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm">
      [BANNER Iklan Placeholder]
    </div>
  );

  return (
    <div className="flex flex-col gap-6 h-full">
      {promoTopBanner ? (
        <PromoBanner banner={promoTopBanner} className="h-[248px]" />
      ) : renderPlaceholder()}
      {promoBottomBanner ? (
        <PromoBanner banner={promoBottomBanner} className="h-[248px]" />
      ) : renderPlaceholder()}
    </div>
  );
})()}
          </div>
        </section>
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
