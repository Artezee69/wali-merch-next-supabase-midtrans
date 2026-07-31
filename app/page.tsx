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
    const ai = adminOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bi = adminOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });

  return mapped.slice(0, ids.length);
}

export default async function Home() {
  const home = await getHomepageSettings();
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
    <main className="min-h-screen bg-black">
      <Navbar />

      {/* Hero + Promo */}
      {heroBanners.length > 0 && (
        <section className="px-4 pt-4 pb-0 md:px-6 md:pt-8">
          <div className={`max-w-7xl mx-auto ${hasPromos ? "hidden md:grid md:grid-cols-[1.6fr_1fr] md:items-start md:gap-6" : ""}`}>
            <HeroCarousel
              banners={heroBanners}
              fillHeight={hasPromos}
              className={hasPromos ? "hidden md:block h-[480px] md:h-[520px]" : "h-[420px] sm:h-[500px] md:h-[600px]"}
            />
          </div>

          {/* Promo banners - vertical on mobile, horizontal on desktop */}
          {hasPromos && (
            <div className={`max-w-7xl mx-auto mt-4 md:mt-0 ${hasPromos ? "hidden md:block" : ""}`}>
              <div className={`${hasPromos ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}`}>
                {promoTopBanner && (
                  <PromoBanner
                    banner={promoTopBanner}
                    className={hasPromos ? "h-[160px] sm:h-[200px]" : "h-[220px]"}
                  />
                )}
                {promoBottomBanner && (
                  <PromoBanner
                    banner={promoBottomBanner}
                    className={hasPromos ? "h-[160px] sm:h-[200px]" : "h-[220px]"}
                  />
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Marquee */}
      {home.sections.marquee && home.marqueeSection.enabled && (
        <div className="py-4 md:py-6 bg-black/50 border-y border-white/5 overflow-hidden">
          <Marquee items={home.marqueeSection.texts} />
        </div>
      )}

      {/* Product Showcase */}
      {home.latestDrop.enabled && latestDropProducts.length > 0 && (
        <ProductShowcase
          products={latestDropProducts}
          description={home.latestDrop.description}
          ctaLabel={home.latestDrop.ctaLabel}
          ctaUrl={home.latestDrop.ctaUrl}
          backgroundColor={home.latestDrop.backgroundColor}
        />
      )}

      {/* How To Order */}
      {home.sections.howToOrder && home.howToOrderSection.enabled && (
        <HowToOrder />
      )}

      {/* CTA Section */}
      {home.sections.cta && home.ctaSection.enabled && (
        <CtaSection />
      )}

      {/* FAQ */}
      {home.sections.faq && home.faqSection.enabled && (
        <Faq />
      )}

      <Footer />
      <SectionNav />
    </main>
  );
}
