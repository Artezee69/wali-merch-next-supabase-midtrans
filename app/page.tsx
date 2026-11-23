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
    .select("*")
    .eq("status", "active")
    .limit(limit);

  if (error || !products || products.length === 0) return [];

  // Fetch images & variants separately (embed syntax unreliable via service role)
  const ids = products.map((p: any) => p.id);
  const [imgRes, varRes] = await Promise.all([
    supabaseAdmin.from("product_images").select("product_id, image_url, sort_order").in("product_id", ids).order("sort_order"),
    supabaseAdmin.from("product_variants").select("*").in("product_id", ids),
  ]);
  const imgsById: Record<string, Array<{ image_url: string; sort_order?: number }>> = {};
  for (const img of (imgRes.data ?? []) as Array<{ product_id: string; image_url: string; sort_order?: number }>) {
    (imgsById[img.product_id] ||= []).push({ image_url: img.image_url, sort_order: img.sort_order });
  }
  const varsById: Record<string, Array<{ size?: string; stock?: number }>> = {};
  for (const v of varRes.data ?? []) {
    (varsById[v.product_id] ||= []).push(v);
  }

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
      product_images: imgsById[row.id as string]?.length
        ? imgsById[row.id as string]
        : undefined,
      product_variants: varsById[row.id as string]?.length
        ? varsById[row.id as string]
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
    .select("*, product_images(image_url, sort_order), product_variants(*)")
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
      product_images: (row.product_images as Array<{ image_url: string; sort_order?: number }>)?.length
        ? [...(row.product_images as Array<{ image_url: string; sort_order?: number }>)].sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
          )
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
    <main className="min-h-screen bg-black text-white antialiased">
      <Navbar />

      {/* ════════════════ HERO ════════════════ */}
      {heroBanners.length > 0 && (
        <section
          id="home-hero"
          data-section-nav
          className="px-4 pt-5 sm:px-6 md:px-8 sm:pt-6"
        >
          <div
            className={`mx-auto max-w-7xl ${
              hasPromos
                ? "grid grid-cols-1 gap-5 lg:grid-cols-[1.7fr_1fr] lg:items-stretch"
                : ""
            }`}
          >
            <div
              className={
                hasPromos
                  ? "overflow-hidden rounded-2xl"
                  : ""
              }
            >
              <HeroCarousel
                banners={heroBanners}
                fillHeight={hasPromos}
                className={
                  hasPromos
                    ? "h-[420px] sm:h-[520px] md:h-[560px] lg:h-[620px]"
                    : ""
                }
              />
            </div>

            {hasPromos && (
              <div className="grid grid-cols-2 gap-5 lg:flex lg:flex-col lg:gap-5">
                {promoTopBanner ? (
                  <PromoBanner
                    banner={promoTopBanner}
                    className="h-[160px] sm:h-[220px] lg:h-1/2"
                  />
                ) : (
                  <AdPlaceholder />
                )}
                {promoBottomBanner ? (
                  <PromoBanner
                    banner={promoBottomBanner}
                    className="h-[160px] sm:h-[220px] lg:h-1/2"
                  />
                ) : (
                  <AdPlaceholder />
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ════════════════ MARQUEE ════════════════ */}
      {home.sections.marquee && home.marqueeSection.enabled && (
        <div id="section-marquee" data-section-nav>
          <Marquee items={home.marqueeSection.texts} />
        </div>
      )}

      {/* ════════════════ LATEST DROP ════════════════ */}
      {home.latestDrop.enabled && latestDropProducts.length > 0 && (
        <ProductShowcase
          products={latestDropProducts}
          description={home.latestDrop.description}
          ctaLabel={home.latestDrop.ctaLabel}
          ctaUrl={home.latestDrop.ctaUrl}
          backgroundColor={home.latestDrop.backgroundColor}
        />
      )}

      {/* ════════════════ HOW TO ORDER ════════════════ */}
      {home.sections.howToOrder && home.howToOrderSection.enabled && (
        <HowToOrder />
      )}

      {/* ════════════════ CTA ════════════════ */}
      {home.sections.cta && home.ctaSection.enabled && (
        <CtaSection />
      )}

      {/* ════════════════ FAQ ════════════════ */}
      {home.sections.faq && home.faqSection.enabled && (
        <Faq />
      )}

      <Footer />

      <SectionNav />

      {/* SEO meta */}
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

/**
 * Neutral placeholder for an empty ad slot — quiet, unobtrusive,
 * clearly reads "iklan" without competing with the hero.
 */
function AdPlaceholder() {
  return (
    <div className="flex h-[150px] items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] sm:h-[200px] lg:h-1/2">
      <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white/20">
        Iklan
      </span>
    </div>
  );
}
