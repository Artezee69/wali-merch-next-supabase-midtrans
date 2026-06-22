"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import { logAdminAction } from "@/lib/adminAudit";
import { HOMEPAGE_DEFAULTS } from "@/lib/homepageSettings";

type SaveResult = { success: true } | { success: false; error: string };

const KEYS = [
  "homepage_header",
  "homepage_hero",
  "homepage_stats",
  "homepage_trust_badges",
  "homepage_latest_drop",
  "homepage_sections",
  "homepage_marquee",
  "homepage_why_wali",
  "homepage_how_to_order",
  "homepage_cta",
  "homepage_faq",
  "homepage_footer",
  "homepage_seo",
] as const;

const MAX_KEY_LEN = 200;
const MAX_LARGE_JSON_LEN = 100 * 1024; // 100 KB upper bound for each setting

function sanitizeString(value: unknown, max = MAX_KEY_LEN): string {
  if (typeof value !== "string") return "";
  return value.slice(0, max);
}

function safeParseJson(raw: string): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isStringArray(v: unknown, max = 30, itemMax = 120): v is string[] {
  if (!Array.isArray(v)) return false;
  if (v.length > max) return false;
  return v.every((item) => typeof item === "string" && item.length <= itemMax);
}

function stringArrayOrFallback(
  v: unknown,
  fallback: string[],
  max = 30,
  itemMax = 120
): string[] {
  return isStringArray(v, max, itemMax) ? v : fallback;
}

function buildHeaderFromForm(form: FormData) {
  const labels = {
    home: sanitizeString(form.get("menu_home"), 40),
    products: sanitizeString(form.get("menu_products"), 40),
    trackOrder: sanitizeString(form.get("menu_trackOrder"), 40),
    cart: sanitizeString(form.get("menu_cart"), 40),
  };
  return {
    logoUrl: sanitizeString(form.get("logoUrl"), 500),
    logoText: sanitizeString(form.get("logoText"), 40) || HOMEPAGE_DEFAULTS.HEADER.logoText,
    logoSubtitle: sanitizeString(form.get("logoSubtitle"), 40),
    showSubtitle: form.get("showSubtitle") === "on",
    menuLabels: labels,
    loginLabel: sanitizeString(form.get("loginLabel"), 40) || HOMEPAGE_DEFAULTS.HEADER.loginLabel,
    registerLabel: sanitizeString(form.get("registerLabel"), 40) || HOMEPAGE_DEFAULTS.HEADER.registerLabel,
    showLogin: form.get("showLogin") === "on",
    showRegister: form.get("showRegister") === "on",
  };
}

function buildHeroFromForm(form: FormData) {
  const overlay = Math.max(0, Math.min(100, Number(form.get("overlayOpacity")) || 0));
  const bgOpacity = Math.max(0, Math.min(100, Number(form.get("backgroundOpacity")) || 0));
  const bgType = sanitizeString(form.get("backgroundType"), 16);
  return {
    enabled: form.get("enabled") === "on",
    badge: sanitizeString(form.get("badge"), 120),
    headlineTop: sanitizeString(form.get("headlineTop"), 60),
    headlineHighlight: sanitizeString(form.get("headlineHighlight"), 60),
    headlineBottom: sanitizeString(form.get("headlineBottom"), 60),
    description: sanitizeString(form.get("description"), 500),
    primaryCtaLabel: sanitizeString(form.get("primaryCtaLabel"), 40),
    primaryCtaUrl: sanitizeString(form.get("primaryCtaUrl"), 500),
    secondaryCtaLabel: sanitizeString(form.get("secondaryCtaLabel"), 40),
    secondaryCtaUrl: sanitizeString(form.get("secondaryCtaUrl"), 500),
    primaryButtonText: sanitizeString(form.get("primaryCtaLabel"), 40),
    primaryButtonUrl: sanitizeString(form.get("primaryCtaUrl"), 500),
    secondaryButtonText: sanitizeString(form.get("secondaryCtaLabel"), 40),
    secondaryButtonUrl: sanitizeString(form.get("secondaryCtaUrl"), 500),
    backgroundType: (["gradient", "solid", "image"].includes(bgType) ? bgType : "gradient") as
      | "gradient"
      | "solid"
      | "image",
    backgroundColor: sanitizeString(form.get("backgroundColor"), 30) || "#0b0b0b",
    backgroundImageUrl: sanitizeString(form.get("backgroundImageUrl"), 500),
    backgroundGradient: sanitizeString(form.get("backgroundGradient"), 1000),
    overlayOpacity: overlay,
    backgroundOpacity: bgOpacity,
  };
}

function parseJsonField(form: FormData, field: string): unknown {
  const raw = form.get(field);
  if (typeof raw !== "string" || !raw.trim()) return null;
  return safeParseJson(raw);
}

function buildStatsFromForm(form: FormData) {
  const raw = parseJsonField(form, "stats_json");
  if (!raw) return HOMEPAGE_DEFAULTS.HERO ? [] : []; // see build
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s, idx) => {
      const it = (s ?? {}) as Record<string, unknown>;
      return {
        id: sanitizeString(it.id, 40) || `stat-${idx}`,
        value: sanitizeString(it.value, 40),
        label: sanitizeString(it.label, 80),
      };
    })
    .filter((s) => s.value || s.label)
    .slice(0, 12);
}

function buildTrustBadgesFromForm(form: FormData) {
  const raw = parseJsonField(form, "trust_badges_json");
  if (!Array.isArray(raw)) return [];
  return raw
    .map((b, idx) => {
      const it = (b ?? {}) as Record<string, unknown>;
      return {
        id: sanitizeString(it.id, 40) || `badge-${idx}`,
        text: sanitizeString(it.text, 80),
        icon: sanitizeString(it.icon, 40) || "ShieldCheck",
        enabled: it.enabled === true || it.enabled === "true" || it.enabled === 1,
      };
    })
    .filter((b) => b.text)
    .slice(0, 12);
}

function buildLatestDropFromForm(form: FormData) {
  const mode = sanitizeString(form.get("latestDrop_mode"), 16) === "manual" ? "manual" : "auto";
  const raw = parseJsonField(form, "latestDrop_manual_json");
  const manual = Array.isArray(raw)
    ? raw
        .map((id) => sanitizeString(id, 64))
        .filter(Boolean)
        .slice(0, 50)
    : [];
  return {
    enabled: form.get("latestDrop_enabled") === "on",
    title: sanitizeString(form.get("latestDrop_title"), 100),
    description: sanitizeString(form.get("latestDrop_description"), 500),
    ctaLabel: sanitizeString(form.get("latestDrop_ctaLabel"), 40),
    ctaUrl: sanitizeString(form.get("latestDrop_ctaUrl"), 500),
    limit: Math.max(1, Math.min(24, Number(form.get("latestDrop_limit")) || 6)),
    backgroundColor: sanitizeString(form.get("latestDrop_backgroundColor"), 30) || "#0b0b0b",
    mode,
    manualProductIds: manual,
  };
}

function buildSectionsFromForm(form: FormData) {
  return {
    marquee: form.get("section_marquee") === "on",
    whyWali: form.get("section_whyWali") === "on",
    howToOrder: form.get("section_howToOrder") === "on",
    cta: form.get("section_cta") === "on",
    faq: form.get("section_faq") === "on",
  };
}

function buildMarqueeFromForm(form: FormData) {
  const raw = parseJsonField(form, "marquee_texts_json");
  const texts = stringArrayOrFallback(raw, HOMEPAGE_DEFAULTS.MARQUEE.texts);
  return {
    enabled: form.get("marquee_enabled") === "on",
    texts: texts.map((t) => sanitizeString(t, 60)).filter(Boolean).slice(0, 30),
  };
}

function buildWhyWaliFromForm(form: FormData) {
  const raw = parseJsonField(form, "why_items_json");
  const items = Array.isArray(raw)
    ? raw
        .map((it, idx) => {
          const obj = (it ?? {}) as Record<string, unknown>;
          return {
            id: sanitizeString(obj.id, 40) || `ww-${idx}`,
            title: sanitizeString(obj.title, 80),
            description: sanitizeString(obj.description, 300),
            icon: sanitizeString(obj.icon, 40) || "ShieldCheck",
          };
        })
        .filter((it) => it.title)
        .slice(0, 8)
    : [];
  return {
    enabled: form.get("why_enabled") === "on",
    title: sanitizeString(form.get("why_title"), 100),
    description: sanitizeString(form.get("why_description"), 300),
    items,
  };
}

function buildHowToOrderFromForm(form: FormData) {
  const raw = parseJsonField(form, "how_steps_json");
  const steps = Array.isArray(raw)
    ? raw
        .map((s, idx) => {
          const obj = (s ?? {}) as Record<string, unknown>;
          return {
            id: sanitizeString(obj.id, 40) || `hto-${idx}`,
            step: sanitizeString(obj.step, 8),
            title: sanitizeString(obj.title, 80),
            description: sanitizeString(obj.description, 300),
          };
        })
        .filter((s) => s.title)
        .slice(0, 8)
    : [];
  return {
    enabled: form.get("how_enabled") === "on",
    title: sanitizeString(form.get("how_title"), 100),
    description: sanitizeString(form.get("how_description"), 300),
    steps,
  };
}

function buildCtaFromForm(form: FormData) {
  return {
    enabled: form.get("cta_enabled") === "on",
    title: sanitizeString(form.get("cta_title"), 100),
    description: sanitizeString(form.get("cta_description"), 500),
    primaryLabel: sanitizeString(form.get("cta_primaryLabel"), 40),
    primaryUrl: sanitizeString(form.get("cta_primaryUrl"), 500),
    secondaryLabel: sanitizeString(form.get("cta_secondaryLabel"), 40),
    secondaryUrl: sanitizeString(form.get("cta_secondaryUrl"), 500),
  };
}

function buildFaqFromForm(form: FormData) {
  const raw = parseJsonField(form, "faq_items_json");
  const items = Array.isArray(raw)
    ? raw
        .map((it, idx) => {
          const obj = (it ?? {}) as Record<string, unknown>;
          return {
            id: sanitizeString(obj.id, 40) || `faq-${idx}`,
            question: sanitizeString(obj.question, 200),
            answer: sanitizeString(obj.answer, 1000),
          };
        })
        .filter((it) => it.question && it.answer)
        .slice(0, 30)
    : [];
  return {
    enabled: form.get("faq_enabled") === "on",
    title: sanitizeString(form.get("faq_title"), 100),
    description: sanitizeString(form.get("faq_description"), 300),
    items,
  };
}

function buildFooterFromForm(form: FormData) {
  const raw = parseJsonField(form, "footer_links_json");
  const links = Array.isArray(raw)
    ? raw
        .map((l, idx) => {
          const obj = (l ?? {}) as Record<string, unknown>;
          return {
            id: sanitizeString(obj.id, 40) || `l-${idx}`,
            label: sanitizeString(obj.label, 40),
            url: sanitizeString(obj.url, 500),
          };
        })
        .filter((l) => l.label && l.url)
        .slice(0, 12)
    : [];
  return {
    logoUrl: sanitizeString(form.get("footer_logoUrl"), 500),
    logoText: sanitizeString(form.get("footer_logoText"), 40),
    brandDescription: sanitizeString(form.get("footer_brandDescription"), 500),
    address: sanitizeString(form.get("footer_address"), 200),
    email: sanitizeString(form.get("footer_email"), 120),
    whatsapp: sanitizeString(form.get("footer_whatsapp"), 30),
    instagram: sanitizeString(form.get("footer_instagram"), 200),
    tiktok: sanitizeString(form.get("footer_tiktok"), 200),
    youtube: sanitizeString(form.get("footer_youtube"), 200),
    copyrightText: sanitizeString(form.get("footer_copyrightText"), 200),
    links,
  };
}

function buildSeoFromForm(form: FormData) {
  return {
    metaTitle: sanitizeString(form.get("seo_metaTitle"), 80),
    metaDescription: sanitizeString(form.get("seo_metaDescription"), 300),
    ogTitle: sanitizeString(form.get("seo_ogTitle"), 80),
    ogDescription: sanitizeString(form.get("seo_ogDescription"), 300),
    ogImage: sanitizeString(form.get("seo_ogImage"), 500),
  };
}

function jsonStringify(value: unknown): string {
  return JSON.stringify(value);
}

export async function saveHomepageSettings(formData: FormData): Promise<SaveResult> {
  const session = await requireAdmin();

  const section = sanitizeString(formData.get("__section"), 40);

  let rows: Array<{ key: string; value: string }> = [];
  try {
    switch (section) {
      case "header":
        rows.push({ key: "homepage_header", value: jsonStringify(buildHeaderFromForm(formData)) });
        break;
      case "hero":
        rows.push({ key: "homepage_hero", value: jsonStringify(buildHeroFromForm(formData)) });
        break;
      case "stats":
        rows.push({ key: "homepage_stats", value: jsonStringify(buildStatsFromForm(formData)) });
        break;
      case "trust_badges":
        rows.push({ key: "homepage_trust_badges", value: jsonStringify(buildTrustBadgesFromForm(formData)) });
        break;
      case "latest_drop":
        rows.push({ key: "homepage_latest_drop", value: jsonStringify(buildLatestDropFromForm(formData)) });
        break;
      case "sections":
        rows.push({ key: "homepage_sections", value: jsonStringify(buildSectionsFromForm(formData)) });
        break;
      case "marquee":
        rows.push({ key: "homepage_marquee", value: jsonStringify(buildMarqueeFromForm(formData)) });
        break;
      case "why_wali":
        rows.push({ key: "homepage_why_wali", value: jsonStringify(buildWhyWaliFromForm(formData)) });
        break;
      case "how_to_order":
        rows.push({ key: "homepage_how_to_order", value: jsonStringify(buildHowToOrderFromForm(formData)) });
        break;
      case "cta":
        rows.push({ key: "homepage_cta", value: jsonStringify(buildCtaFromForm(formData)) });
        break;
      case "faq":
        rows.push({ key: "homepage_faq", value: jsonStringify(buildFaqFromForm(formData)) });
        break;
      case "footer":
        rows.push({ key: "homepage_footer", value: jsonStringify(buildFooterFromForm(formData)) });
        break;
      case "seo":
        rows.push({ key: "homepage_seo", value: jsonStringify(buildSeoFromForm(formData)) });
        break;
      default:
        return { success: false, error: "Section tidak dikenali." };
    }
  } catch (err) {
    console.error("[saveHomepageSettings] build error:", err);
    return { success: false, error: "Gagal memproses input." };
  }

  for (const r of rows) {
    if (r.value.length > MAX_LARGE_JSON_LEN) {
      return { success: false, error: `Nilai untuk ${r.key} terlalu besar.` };
    }
  }

  const now = new Date().toISOString();
  const upsertRows = rows.map((r) => ({
    key: r.key,
    value: r.value,
    updated_at: now,
    updated_by: session.userId,
  }));

  const { error } = await supabaseAdmin
    .from("store_settings")
    .upsert(upsertRows, { onConflict: "key" });

  if (error) {
    console.error("[saveHomepageSettings] upsert error:", error.message);
    return { success: false, error: error.message };
  }

  await logAdminAction({
    actorId: session.userId,
    actorEmail: session.email,
    action: "settings.updated",
    entity: "homepage_settings",
    entityId: section,
    metadata: { keys: rows.map((r) => r.key) },
  });

  revalidatePath("/admin/homepage");
  revalidatePath("/");

  return { success: true };
}

export async function resetHomepageSection(section: string): Promise<SaveResult> {
  const session = await requireAdmin();
  const key = `homepage_${section}`;
  if (!KEYS.includes(key as (typeof KEYS)[number])) {
    return { success: false, error: "Section tidak dikenali." };
  }

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("store_settings")
    .upsert(
      { key, value: null, updated_at: now, updated_by: session.userId },
      { onConflict: "key" }
    );

  if (error) {
    console.error("[resetHomepageSection] upsert error:", error.message);
    return { success: false, error: error.message };
  }

  await logAdminAction({
    actorId: session.userId,
    actorEmail: session.email,
    action: "settings.updated",
    entity: "homepage_settings",
    entityId: section,
    metadata: { reset: true },
  });

  revalidatePath("/admin/homepage");
  revalidatePath("/");
  return { success: true };
}
