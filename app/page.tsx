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
import SectionNav from "@/components/SectionNav";

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

      {home.latestDrop.enabled && (
        <ProductShowcase />
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
