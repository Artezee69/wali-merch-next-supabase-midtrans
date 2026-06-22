"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import { logAdminAction } from "@/lib/adminAudit";

type SaveResult = { ok: true } | { ok: false; error: string };

type Fdv = FormDataEntryValue | null;

function pickString(value: Fdv): string {
  if (typeof value === "string") return value;
  if (value instanceof File) return value.name;
  return "";
}

function pickNumber(value: Fdv, fallback = 0): number {
  const n = Number(pickString(value));
  return Number.isFinite(n) ? n : fallback;
}

function pickBool(value: Fdv): boolean {
  if (typeof value !== "string") return false;
  return value === "1" || value === "true" || value === "on";
}

function pickArray(value: Fdv): string[] {
  if (typeof value !== "string") return [];
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function pickJson(value: Fdv): unknown {
  const raw = pickString(value);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function strOrEmpty(v: string | undefined | null): string {
  return typeof v === "string" ? v : "";
}

async function writeJsonRow(key: string, value: unknown) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("store_settings")
    .upsert(
      {
        key,
        value: JSON.stringify(value ?? {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
  if (error) throw new Error(error.message);
}

async function writeStringRow(key: string, value: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("store_settings")
    .upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
  if (error) throw new Error(error.message);
}

async function loadRow(key: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as { value: string | null } | null)?.value ?? null;
}

function safeString(value: string, max = 5000): string {
  return value.trim().slice(0, max);
}

function safeNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function normalizeStat(input: { id?: string; value?: string; label?: string }) {
  return {
    id: (input.id && strOrEmpty(input.id)) || `stat-${Math.random().toString(36).slice(2, 8)}`,
    value: safeString(strOrEmpty(input.value), 32),
    label: safeString(strOrEmpty(input.label), 64),
  };
}

function normalizeBadge(input: { id?: string; text?: string; icon?: string; enabled?: boolean }) {
  return {
    id: (input.id && strOrEmpty(input.id)) || `badge-${Math.random().toString(36).slice(2, 8)}`,
    text: safeString(strOrEmpty(input.text), 64),
    icon: safeString(strOrEmpty(input.icon), 32),
    enabled: input.enabled ?? false,
  };
}

function normalizeWhyItem(input: { id?: string; title?: string; description?: string; icon?: string }) {
  return {
    id: (input.id && strOrEmpty(input.id)) || `ww-${Math.random().toString(36).slice(2, 8)}`,
    title: safeString(strOrEmpty(input.title), 80),
    description: safeString(strOrEmpty(input.description), 500),
    icon: safeString(strOrEmpty(input.icon), 32),
  };
}

function normalizeHowStep(input: { id?: string; step?: string; title?: string; description?: string }) {
  return {
    id: (input.id && strOrEmpty(input.id)) || `hto-${Math.random().toString(36).slice(2, 8)}`,
    step: safeString(strOrEmpty(input.step), 8),
    title: safeString(strOrEmpty(input.title), 80),
    description: safeString(strOrEmpty(input.description), 500),
  };
}

function normalizeFaqItem(input: { id?: string; question?: string; answer?: string }) {
  return {
    id: (input.id && strOrEmpty(input.id)) || `faq-${Math.random().toString(36).slice(2, 8)}`,
    question: safeString(strOrEmpty(input.question), 200),
    answer: safeString(strOrEmpty(input.answer), 1000),
  };
}

function normalizeProduct(input: { id?: string }) {
  return {
    id: strOrEmpty(input.id),
  };
}

async function saveSettings(formData: FormData): Promise<SaveResult> {
  try {
    const admin = await requireAdmin();

    const generalName = pickString(formData.get("general.name"));
    const generalEmail = pickString(formData.get("general.email"));
    const generalPhone = pickString(formData.get("general.phone"));
    const generalAddress = pickString(formData.get("general.address"));
    const generalLowStockThreshold = pickNumber(formData.get("general.lowStockThreshold"), 5);

    await writeJsonRow("general", {
      name: generalName,
      email: generalEmail,
      phone: generalPhone,
      address: generalAddress,
      lowStockThreshold: generalLowStockThreshold,
    });

    const headerBrandName = pickString(formData.get("header.brandName"));
    const headerBrandSubtitle = pickString(formData.get("header.brandSubtitle"));
    const headerNavHome = pickString(formData.get("header.navHome"));
    const headerNavProducts = pickString(formData.get("header.navProducts"));
    const headerNavTrackOrder = pickString(formData.get("header.navTrackOrder"));
    const headerNavCart = pickString(formData.get("header.navCart"));
    const headerLoginLabel = pickString(formData.get("header.loginLabel"));
    const headerRegisterLabel = pickString(formData.get("header.registerLabel"));
    const headerLogoUrl = pickString(formData.get("header.logoUrl"));

    await writeJsonRow("header", {
      brandName: headerBrandName,
      brandSubtitle: headerBrandSubtitle,
      navHome: headerNavHome,
      navProducts: headerNavProducts,
      navTrackOrder: headerNavTrackOrder,
      navCart: headerNavCart,
      loginLabel: headerLoginLabel,
      registerLabel: headerRegisterLabel,
      logoUrl: headerLogoUrl,
    });

    const heroBadge = pickString(formData.get("hero.badge"));
    const heroTitlePrefix = pickString(formData.get("hero.titlePrefix"));
    const heroTitleHighlight = pickString(formData.get("hero.titleHighlight"));
    const heroTitleSuffix = pickString(formData.get("hero.titleSuffix"));
    const heroDescription = pickString(formData.get("hero.description"));
    const heroButtonText = pickString(formData.get("hero.buttonText"));
    const heroButtonUrl = pickString(formData.get("hero.buttonUrl"));
    const heroSecondaryButtonText = pickString(formData.get("hero.secondaryButtonText"));
    const heroSecondaryButtonUrl = pickString(formData.get("hero.secondaryButtonUrl"));
    const heroActive = pickBool(formData.get("hero.active"));
    const heroBackgroundColor = pickString(formData.get("hero.backgroundColor"));
    const heroBackgroundImage = pickString(formData.get("hero.backgroundImage"));

    await writeJsonRow("hero", {
      badge: heroBadge,
      titlePrefix: heroTitlePrefix,
      titleHighlight: heroTitleHighlight,
      titleSuffix: heroTitleSuffix,
      description: heroDescription,
      buttonText: heroButtonText,
      buttonUrl: heroButtonUrl,
      secondaryButtonText: heroSecondaryButtonText,
      secondaryButtonUrl: heroSecondaryButtonUrl,
      active: heroActive,
      backgroundColor: heroBackgroundColor,
      backgroundImage: heroBackgroundImage,
    });

    const marqueeTextsRaw = formData.getAll("marquee.texts");
    const marqueeActive = pickBool(formData.get("marquee.active"));
    const marqueeTexts = (Array.isArray(marqueeTextsRaw) ? marqueeTextsRaw : [marqueeTextsRaw])
      .map((t) => (typeof t === "string" ? t.trim() : ""))
      .filter(Boolean);

    await writeJsonRow("marquee", {
      texts: marqueeTexts,
      active: marqueeActive,
    });

    // Showcase / Latest Drop
    const showcaseEyebrow = pickString(formData.get("showcase.eyebrow"));
    const showcaseTitle = pickString(formData.get("showcase.title"));
    const showcaseSubtitle = pickString(formData.get("showcase.subtitle"));
    const showcaseButtonText = pickString(formData.get("showcase.buttonText"));
    const showcaseEmptyText = pickString(formData.get("showcase.emptyText"));
    const showcaseItemCount = pickNumber(formData.get("showcase.itemCount"), 8);
    const showcaseMode = pickString(formData.get("showcase.mode")) as "latest" | "manual";
    const showcaseActive = pickBool(formData.get("showcase.active"));

    // Manual product selections
    const showcaseProductsRaw = formData.getAll("showcase.products");
    const showcaseProducts = (Array.isArray(showcaseProductsRaw) ? showcaseProductsRaw : [showcaseProductsRaw])
      .map((p) => {
        if (typeof p === "string") {
          try {
            return JSON.parse(p) as { id: string };
          } catch {
            return { id: p };
          }
        }
        if (p instanceof File) return { id: "" };
        return { id: strOrEmpty(p as string) };
      })
      .filter((p) => p.id);

    await writeJsonRow("showcase", {
      eyebrow: showcaseEyebrow,
      title: showcaseTitle,
      subtitle: showcaseSubtitle,
      buttonText: showcaseButtonText,
      emptyText: showcaseEmptyText,
      itemCount: showcaseItemCount,
      mode: showcaseMode === "manual" ? "manual" : "latest",
      products: showcaseProducts,
      active: showcaseActive,
    });

    // Why Wali
    const whyBadge = pickString(formData.get("why.badge"));
    const whyTitle = pickString(formData.get("why.title"));
    const whyDescription = pickString(formData.get("why.description"));
    const whyActive = pickBool(formData.get("why.active"));

    const whyItemsRaw = formData.getAll("why.items");
    const whyItems = (Array.isArray(whyItemsRaw) ? whyItemsRaw : [whyItemsRaw])
      .map((i) => {
        if (typeof i === "string") {
          try {
            const parsed = JSON.parse(i) as { id?: string; title?: string; description?: string; icon?: string };
            return normalizeWhyItem(parsed);
          } catch {
            return null;
          }
        }
        return null;
      })
      .filter(Boolean) as Array<{ id: string; title: string; description: string; icon: string }>;

    await writeJsonRow("whyWali", {
      badge: whyBadge,
      title: whyTitle,
      description: whyDescription,
      items: whyItems.length > 0 ? whyItems : [],
      active: whyActive,
    });

    // How To Order
    const howEyebrow = pickString(formData.get("howToOrder.eyebrow"));
    const howTitle = pickString(formData.get("howToOrder.title"));
    const howSubtitle = pickString(formData.get("howToOrder.subtitle"));
    const howActive = pickBool(formData.get("howToOrder.active"));

    const howStepsRaw = formData.getAll("howToOrder.steps");
    const howSteps = (Array.isArray(howStepsRaw) ? howStepsRaw : [howStepsRaw])
      .map((s) => {
        if (typeof s === "string") {
          try {
            const parsed = JSON.parse(s) as { id?: string; step?: string; title?: string; description?: string };
            return normalizeHowStep(parsed);
          } catch {
            return null;
          }
        }
        return null;
      })
      .filter(Boolean) as Array<{ id: string; step: string; title: string; description: string }>;

    const howCtaText = pickString(formData.get("howToOrder.ctaText"));
    const howCtaUrl = pickString(formData.get("howToOrder.ctaUrl"));

    await writeJsonRow("howToOrder", {
      eyebrow: howEyebrow,
      title: howTitle,
      subtitle: howSubtitle,
      steps: howSteps.length > 0 ? howSteps : [],
      ctaText: howCtaText,
      ctaUrl: howCtaUrl,
      active: howActive,
    });

    // FAQ
    const faqEyebrow = pickString(formData.get("faq.eyebrow"));
    const faqTitle = pickString(formData.get("faq.title"));
    const faqDescription = pickString(formData.get("faq.description"));
    const faqActive = pickBool(formData.get("faq.active"));

    const faqItemsRaw = formData.getAll("faq.items");
    const faqItems = (Array.isArray(faqItemsRaw) ? faqItemsRaw : [faqItemsRaw])
      .map((i) => {
        if (typeof i === "string") {
          try {
            const parsed = JSON.parse(i) as { id?: string; question?: string; answer?: string };
            return normalizeFaqItem(parsed);
          } catch {
            return null;
          }
        }
        return null;
      })
      .filter(Boolean) as Array<{ id: string; question: string; answer: string }>;

    await writeJsonRow("faq", {
      eyebrow: faqEyebrow,
      title: faqTitle,
      description: faqDescription,
      items: faqItems.length > 0 ? faqItems : [],
      active: faqActive,
    });

    // CTA Section
    const ctaTitle = pickString(formData.get("cta.title"));
    const ctaDescription = pickString(formData.get("cta.description"));
    const ctaButtonText = pickString(formData.get("cta.buttonText"));
    const ctaButtonUrl = pickString(formData.get("cta.buttonUrl"));
    const ctaSecondaryButtonText = pickString(formData.get("cta.secondaryButtonText"));
    const ctaSecondaryButtonUrl = pickString(formData.get("cta.secondaryButtonUrl"));
    const ctaActive = pickBool(formData.get("cta.active"));

    await writeJsonRow("ctaSection", {
      title: ctaTitle,
      description: ctaDescription,
      buttonText: ctaButtonText,
      buttonUrl: ctaButtonUrl,
      secondaryButtonText: ctaSecondaryButtonText,
      secondaryButtonUrl: ctaSecondaryButtonUrl,
      active: ctaActive,
    });

    // Footer
    const footerLogoUrl = pickString(formData.get("footer.logoUrl"));
    const footerBrandName = pickString(formData.get("footer.brandName"));
    const footerDescription = pickString(formData.get("footer.description"));
    const footerAddress = pickString(formData.get("footer.address"));
    const footerEmail = pickString(formData.get("footer.email"));
    const footerPhone = pickString(formData.get("footer.phone"));
    const footerCopyright = pickString(formData.get("footer.copyright"));

    const footerSocialsRaw = formData.getAll("footer.socials");
    const footerSocials = (Array.isArray(footerSocialsRaw) ? footerSocialsRaw : [footerSocialsRaw])
      .map((s) => {
        if (typeof s === "string") {
          try {
            return JSON.parse(s) as { id?: string; name?: string; url?: string; enabled?: boolean };
          } catch {
            return null;
          }
        }
        return null;
      })
      .filter(Boolean);

    const footerLinksRaw = formData.getAll("footer.links");
    const footerLinks = (Array.isArray(footerLinksRaw) ? footerLinksRaw : [footerLinksRaw])
      .map((l) => {
        if (typeof l === "string") {
          try {
            return JSON.parse(l) as { id?: string; label?: string; url?: string; enabled?: boolean };
          } catch {
            return null;
          }
        }
        return null;
      })
      .filter(Boolean);

    await writeJsonRow("footer", {
      logoUrl: footerLogoUrl,
      brandName: footerBrandName,
      description: footerDescription,
      address: footerAddress,
      email: footerEmail,
      phone: footerPhone,
      copyright: footerCopyright,
      socials: footerSocials.length > 0 ? footerSocials : [],
      links: footerLinks.length > 0 ? footerLinks : [],
    });

    // SEO
    const seoMetaTitle = pickString(formData.get("seo.metaTitle"));
    const seoMetaDescription = pickString(formData.get("seo.metaDescription"));
    const seoOgTitle = pickString(formData.get("seo.ogTitle"));
    const seoOgDescription = pickString(formData.get("seo.ogDescription"));
    const seoOgImage = pickString(formData.get("seo.ogImage"));
    const seoActive = pickBool(formData.get("seo.active"));

    await writeJsonRow("seo", {
      metaTitle: seoMetaTitle,
      metaDescription: seoMetaDescription,
      ogTitle: seoOgTitle,
      ogDescription: seoOgDescription,
      ogImage: seoOgImage,
      active: seoActive,
    });

    revalidatePath("/");
    revalidatePath("/admin/settings");

    await logAdminAction({
      actorId: admin.userId ?? null,
      action: "settings.updated",
      entity: "homepage",
      after: {
        message: "All homepage settings saved successfully",
      },
    });

    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { ok: false, error: "Unauthorized" };
    }
    return { ok: false, error: (error as Error).message || "Failed to save settings" };
  }
}

export { saveSettings };
