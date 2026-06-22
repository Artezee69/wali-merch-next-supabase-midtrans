"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Save,
  Check,
  X,
  Loader2,
  RotateCcw,
  Image as ImageIcon,
  AlertTriangle,
} from "lucide-react";
import {
  saveHomepageSettings,
  resetHomepageSection,
} from "@/app/admin/homepage/actions";

type StatsValue = { id: string; value: string; label: string };
type TrustBadgeValue = { id: string; text: string; icon: string; enabled: boolean };
type WhyWaliItem = { id: string; title: string; description: string; icon: string };
type HowToOrderStep = { id: string; step: string; title: string; description: string };
type FaqItem = { id: string; question: string; answer: string };
type FooterLink = { id: string; label: string; url: string };

type HeroSettings = {
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

type HeaderSettings = {
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

type LatestDropSettings = {
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

type SectionsSettings = {
  marquee: boolean;
  whyWali: boolean;
  howToOrder: boolean;
  cta: boolean;
  faq: boolean;
};

type MarqueeSettings = { enabled: boolean; texts: string[] };

type WhyWaliSettings = {
  enabled: boolean;
  title: string;
  description: string;
  items: WhyWaliItem[];
};

type HowToOrderSettings = {
  enabled: boolean;
  title: string;
  description: string;
  steps: HowToOrderStep[];
};

type CtaSettings = {
  enabled: boolean;
  title: string;
  description: string;
  primaryLabel: string;
  primaryUrl: string;
  secondaryLabel: string;
  secondaryUrl: string;
};

type FaqSettings = { enabled: boolean; title: string; description: string; items: FaqItem[] };
type FooterSettings = {
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

type SeoSettings = {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
};

type Values = {
  header: HeaderSettings;
  hero: HeroSettings;
  stats: StatsValue[];
  trustBadges: TrustBadgeValue[];
  latestDrop: LatestDropSettings;
  sections: SectionsSettings;
  marquee: MarqueeSettings;
  whyWali: WhyWaliSettings;
  howToOrder: HowToOrderSettings;
  cta: CtaSettings;
  faq: FaqSettings;
  footer: FooterSettings;
  seo: SeoSettings;
};

const TABS: { key: keyof Values; label: string; helper: string }[] = [
  { key: "header", label: "Header", helper: "Logo, menu, login/register" },
  { key: "hero", label: "Hero", helper: "Headline, CTA, background" },
  { key: "stats", label: "Stat", helper: "Angka pencapaian" },
  { key: "trustBadges", label: "Trust Badges", helper: "Lambang kepercayaan" },
  { key: "latestDrop", label: "Latest Drop", helper: "Section produk terbaru" },
  { key: "sections", label: "Sections", helper: "Aktif/nonaktif section" },
  { key: "marquee", label: "Marquee", helper: "Running text" },
  { key: "whyWali", label: "Why WALI", helper: "Alasan kenapa beli" },
  { key: "howToOrder", label: "How To Order", helper: "Langkah order" },
  { key: "cta", label: "CTA Banner", helper: "Banner call-to-action" },
  { key: "faq", label: "FAQ", helper: "Pertanyaan umum" },
  { key: "footer", label: "Footer", helper: "Info brand, sosmed, link" },
  { key: "seo", label: "SEO", helper: "Meta & OpenGraph" },
];

const ICON_OPTIONS = [
  "ShieldCheck",
  "Sparkles",
  "Truck",
  "BadgeCheck",
  "Award",
  "CheckCircle2",
  "Star",
  "Heart",
  "Zap",
  "Lock",
  "Package",
  "Globe",
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/50">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-white/35">{hint}</p>}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#d7ff53]";

const textareaBase =
  "w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#d7ff53]";

function Toggle({
  name,
  checked,
  label,
}: {
  name: string;
  checked: boolean;
  label?: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-white/70">
      <input type="checkbox" name={name} defaultChecked={checked} className="peer sr-only" />
      <span className="relative h-6 w-11 rounded-full border border-white/10 bg-white/10 transition peer-checked:border-[#d7ff53] peer-checked:bg-[#d7ff53]/80">
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}

function SectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5 ${className}`}
    >
      <h3 className="mb-3 text-sm font-black uppercase tracking-widest text-white/80">
        {title}
      </h3>
      {children}
    </div>
  );
}

function genId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function addId<T extends { id: string }>(arr: T[], prefix: string, make: () => Omit<T, "id">): T[] {
  return [...arr, { ...(make() as T), id: genId(prefix) }];
}

function updateAt<T extends { id: string }>(arr: T[], id: string, patch: Partial<T>): T[] {
  return arr.map((it) => (it.id === id ? { ...it, ...patch } : it));
}

function removeAt<T extends { id: string }>(arr: T[], id: string): T[] {
  return arr.filter((it) => it.id !== id);
}

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function reorderButtons<T extends { id: string }>(
  arr: T[],
  id: string,
  dir: -1 | 1
): T[] {
  const idx = arr.findIndex((it) => it.id === id);
  if (idx < 0) return arr;
  const target = idx + dir;
  if (target < 0 || target >= arr.length) return arr;
  return moveItem(arr, idx, target);
}

function Banner({ kind, children }: { kind: "ok" | "err"; children: React.ReactNode }) {
  if (kind === "ok") {
    return (
      <div className="mb-4 flex items-start gap-2 rounded-2xl border border-[#d7ff53]/30 bg-[#d7ff53]/5 p-3 text-xs text-[#d7ff53]">
        <Check size={14} className="mt-0.5 shrink-0" />
        <div>{children}</div>
      </div>
    );
  }
  return (
    <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-300">
      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

type Props = {
  initialTab: string;
  initialValues: Values;
};

export default function HomepageSettingsClient({ initialTab, initialValues }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<string>(initialTab);
  const [values, setValues] = useState<Values>(initialValues);
  const [pending, startTransition] = useTransition();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; message: string } | null>(null);

  function update<K extends keyof Values>(key: K, patch: Partial<Values[K]>) {
    setValues((prev) => ({ ...prev, [key]: { ...(prev[key] as object), ...patch } as Values[K] }));
  }

  function changeTab(next: string) {
    setTab(next);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("tab", next);
    router.replace(`/admin/homepage?${params.toString()}`);
  }

  async function handleSave(section: string, buildFormData: () => FormData) {
    setStatus(null);
    setActiveSection(section);
    startTransition(async () => {
      try {
        const formData = buildFormData();
        const res = await saveHomepageSettings(formData);
        if (res.success) {
          setStatus({ kind: "ok", message: "Pengaturan berhasil disimpan." });
          router.refresh();
        } else {
          setStatus({ kind: "err", message: res.error || "Gagal menyimpan." });
        }
      } catch (err) {
        console.error(err);
        setStatus({ kind: "err", message: "Terjadi kesalahan tak terduga." });
      } finally {
        setActiveSection(null);
      }
    });
  }

  function handleReset(section: string) {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      `Reset pengaturan section "${section}" ke default? Data yang tersimpan akan dihapus.`
    );
    if (!ok) return;
    setStatus(null);
    setActiveSection(section);
    startTransition(async () => {
      const res = await resetHomepageSection(section);
      if (res.success) {
        setStatus({ kind: "ok", message: `Section "${section}" direset ke default.` });
        router.refresh();
      } else {
        setStatus({ kind: "err", message: res.error || "Gagal reset." });
      }
      setActiveSection(null);
    });
  }

  const currentTabMeta = useMemo(() => TABS.find((t) => t.key === tab) ?? TABS[0], [tab]);

  return (
    <div>
      {status && <Banner kind={status.kind}>{status.message}</Banner>}

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => changeTab(t.key)}
              className={`rounded-full border px-3.5 py-2 text-xs font-black uppercase tracking-wider transition ${
                active
                  ? "border-[#d7ff53] bg-[#d7ff53] text-black"
                  : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mb-4 text-xs text-white/40">
        <p>
          Tab: <span className="text-white/70">{currentTabMeta.label}</span> — {currentTabMeta.helper}
        </p>
      </div>

      {tab === "header" && (
        <HeaderTab
          values={values}
          update={update}
          pending={pending}
          activeSection={activeSection}
          onSave={handleSave}
          onReset={handleReset}
        />
      )}
      {tab === "hero" && (
        <HeroTab
          values={values}
          update={update}
          pending={pending}
          activeSection={activeSection}
          onSave={handleSave}
          onReset={handleReset}
        />
      )}
      {tab === "stats" && (
        <StatsTab
          values={values}
          setValues={setValues}
          pending={pending}
          activeSection={activeSection}
          onSave={handleSave}
          onReset={handleReset}
        />
      )}
      {tab === "trustBadges" && (
        <TrustBadgesTab
          values={values}
          setValues={setValues}
          pending={pending}
          activeSection={activeSection}
          onSave={handleSave}
          onReset={handleReset}
        />
      )}
      {tab === "latestDrop" && (
        <LatestDropTab
          values={values}
          update={update}
          pending={pending}
          activeSection={activeSection}
          onSave={handleSave}
          onReset={handleReset}
        />
      )}
      {tab === "sections" && (
        <SectionsTab
          values={values}
          update={update}
          pending={pending}
          activeSection={activeSection}
          onSave={handleSave}
          onReset={handleReset}
        />
      )}
      {tab === "marquee" && (
        <MarqueeTab
          values={values}
          setValues={setValues}
          pending={pending}
          activeSection={activeSection}
          onSave={handleSave}
          onReset={handleReset}
        />
      )}
      {tab === "whyWali" && (
        <WhyWaliTab
          values={values}
          setValues={setValues}
          pending={pending}
          activeSection={activeSection}
          onSave={handleSave}
          onReset={handleReset}
        />
      )}
      {tab === "howToOrder" && (
        <HowToOrderTab
          values={values}
          setValues={setValues}
          pending={pending}
          activeSection={activeSection}
          onSave={handleSave}
          onReset={handleReset}
        />
      )}
      {tab === "cta" && (
        <CtaTab
          values={values}
          update={update}
          pending={pending}
          activeSection={activeSection}
          onSave={handleSave}
          onReset={handleReset}
        />
      )}
      {tab === "faq" && (
        <FaqTab
          values={values}
          setValues={setValues}
          pending={pending}
          activeSection={activeSection}
          onSave={handleSave}
          onReset={handleReset}
        />
      )}
      {tab === "footer" && (
        <FooterTab
          values={values}
          setValues={setValues}
          pending={pending}
          activeSection={activeSection}
          onSave={handleSave}
          onReset={handleReset}
        />
      )}
      {tab === "seo" && (
        <SeoTab
          values={values}
          update={update}
          pending={pending}
          activeSection={activeSection}
          onSave={handleSave}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

type TabProps = {
  values: Values;
  pending: boolean;
  activeSection: string | null;
  onSave: (section: string, buildFormData: () => FormData) => void;
  onReset: (section: string) => void;
};

type UpdatableTabProps<K extends keyof Values> = TabProps & {
  update: (key: K, patch: Partial<Values[K]>) => void;
};

function SaveButton({
  pending,
  isActive,
  onSave,
  onReset,
  section,
}: {
  pending: boolean;
  isActive: boolean;
  onSave: () => void;
  onReset: () => void;
  section: string;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onSave}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-[#d7ff53] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black transition hover:bg-white disabled:opacity-60"
      >
        {pending && isActive ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Simpan
      </button>
      <button
        type="button"
        onClick={onReset}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs font-bold text-white/60 transition hover:border-red-500/40 hover:text-red-300 disabled:opacity-60"
      >
        <RotateCcw size={12} /> Reset
      </button>
      <span className="text-[11px] text-white/35">Section: {section}</span>
    </div>
  );
}

function HeaderTab({
  values,
  update,
  pending,
  activeSection,
  onSave,
  onReset,
}: UpdatableTabProps<"header">) {
  const h = values.header;
  const section = "header";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(section, () => {
          const fd = new FormData();
          fd.set("__section", section);
          fd.set("logoUrl", h.logoUrl);
          fd.set("logoText", h.logoText);
          fd.set("logoSubtitle", h.logoSubtitle);
          fd.set("showSubtitle", h.showSubtitle ? "on" : "");
          fd.set("menu_home", h.menuLabels.home);
          fd.set("menu_products", h.menuLabels.products);
          fd.set("menu_trackOrder", h.menuLabels.trackOrder);
          fd.set("menu_cart", h.menuLabels.cart);
          fd.set("loginLabel", h.loginLabel);
          fd.set("registerLabel", h.registerLabel);
          fd.set("showLogin", h.showLogin ? "on" : "");
          fd.set("showRegister", h.showRegister ? "on" : "");
          return fd;
        });
      }}
      className="grid gap-4 md:grid-cols-2"
    >
      <SectionCard title="Brand & Logo">
        <div className="grid gap-3">
          <Field label="Logo URL" hint="URL gambar logo. Kosongkan untuk pakai teks saja.">
            <input
              className={inputBase}
              value={h.logoUrl}
              onChange={(e) => update("header", { logoUrl: e.target.value })}
              placeholder="/uploads/logo.png"
            />
          </Field>
          <Field label="Teks Logo" hint="Ditampilkan kalau tidak ada URL logo.">
            <input
              className={inputBase}
              value={h.logoText}
              onChange={(e) => update("header", { logoText: e.target.value })}
            />
          </Field>
          <Field label="Sub-judul" hint="Misal: Official Merchandise">
            <input
              className={inputBase}
              value={h.logoSubtitle}
              onChange={(e) => update("header", { logoSubtitle: e.target.value })}
            />
          </Field>
          <Toggle
            name="showSubtitle"
            checked={h.showSubtitle}
            label="Tampilkan sub-judul"
          />
        </div>
      </SectionCard>

      <SectionCard title="Menu Navigasi">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Home">
            <input
              className={inputBase}
              value={h.menuLabels.home}
              onChange={(e) =>
                update("header", { menuLabels: { ...h.menuLabels, home: e.target.value } })
              }
            />
          </Field>
          <Field label="Products">
            <input
              className={inputBase}
              value={h.menuLabels.products}
              onChange={(e) =>
                update("header", { menuLabels: { ...h.menuLabels, products: e.target.value } })
              }
            />
          </Field>
          <Field label="Track Order">
            <input
              className={inputBase}
              value={h.menuLabels.trackOrder}
              onChange={(e) =>
                update("header", { menuLabels: { ...h.menuLabels, trackOrder: e.target.value } })
              }
            />
          </Field>
          <Field label="Cart">
            <input
              className={inputBase}
              value={h.menuLabels.cart}
              onChange={(e) =>
                update("header", { menuLabels: { ...h.menuLabels, cart: e.target.value } })
              }
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Tombol Login / Daftar" className="md:col-span-2">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Teks Login">
            <input
              className={inputBase}
              value={h.loginLabel}
              onChange={(e) => update("header", { loginLabel: e.target.value })}
            />
          </Field>
          <Field label="Teks Daftar">
            <input
              className={inputBase}
              value={h.registerLabel}
              onChange={(e) => update("header", { registerLabel: e.target.value })}
            />
          </Field>
          <Toggle name="showLogin" checked={h.showLogin} label="Tampilkan tombol Login" />
          <Toggle name="showRegister" checked={h.showRegister} label="Tampilkan tombol Daftar" />
        </div>
      </SectionCard>

      <div className="md:col-span-2">
        <SaveButton
          pending={pending}
          isActive={activeSection === section}
          onSave={() => {
            const ev = new Event("submit", { cancelable: true });
            const form = document.activeElement?.closest("form") as HTMLFormElement | null;
            form?.dispatchEvent(ev);
          }}
          onReset={() => onReset(section)}
          section={section}
        />
      </div>
    </form>
  );
}

function HeroTab({
  values,
  update,
  pending,
  activeSection,
  onSave,
  onReset,
}: UpdatableTabProps<"hero">) {
  const h = values.hero;
  const section = "hero";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(section, () => {
          const fd = new FormData();
          fd.set("__section", section);
          fd.set("enabled", h.enabled ? "on" : "");
          fd.set("badge", h.badge);
          fd.set("headlineTop", h.headlineTop);
          fd.set("headlineHighlight", h.headlineHighlight);
          fd.set("headlineBottom", h.headlineBottom);
          fd.set("description", h.description);
          fd.set("primaryCtaLabel", h.primaryCtaLabel);
          fd.set("primaryCtaUrl", h.primaryCtaUrl);
          fd.set("secondaryCtaLabel", h.secondaryCtaLabel);
          fd.set("secondaryCtaUrl", h.secondaryCtaUrl);
          fd.set("backgroundType", h.backgroundType);
          fd.set("backgroundColor", h.backgroundColor);
          fd.set("backgroundImageUrl", h.backgroundImageUrl);
          fd.set("backgroundGradient", h.backgroundGradient);
          fd.set("overlayOpacity", String(h.overlayOpacity));
          fd.set("backgroundOpacity", String(h.backgroundOpacity));
          return fd;
        });
      }}
      className="grid gap-4 lg:grid-cols-2"
    >
      <SectionCard title="Konten Hero">
        <div className="grid gap-3">
          <Toggle name="hero_enabled" checked={h.enabled} label="Tampilkan section hero" />
          <Field label="Badge / Eyebrow">
            <input
              className={inputBase}
              value={h.badge}
              onChange={(e) => update("hero", { badge: e.target.value })}
            />
          </Field>
          <Field label="Headline (bagian atas)">
            <input
              className={inputBase}
              value={h.headlineTop}
              onChange={(e) => update("hero", { headlineTop: e.target.value })}
            />
          </Field>
          <Field label="Headline (highlight)">
            <input
              className={inputBase}
              value={h.headlineHighlight}
              onChange={(e) => update("hero", { headlineHighlight: e.target.value })}
            />
          </Field>
          <Field label="Headline (bagian bawah)">
            <input
              className={inputBase}
              value={h.headlineBottom}
              onChange={(e) => update("hero", { headlineBottom: e.target.value })}
            />
          </Field>
          <Field label="Deskripsi">
            <textarea
              className={textareaBase}
              rows={4}
              value={h.description}
              onChange={(e) => update("hero", { description: e.target.value })}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Tombol CTA">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Label CTA Primer">
            <input
              className={inputBase}
              value={h.primaryCtaLabel}
              onChange={(e) => update("hero", { primaryCtaLabel: e.target.value })}
            />
          </Field>
          <Field label="URL CTA Primer">
            <input
              className={inputBase}
              value={h.primaryCtaUrl}
              onChange={(e) => update("hero", { primaryCtaUrl: e.target.value })}
            />
          </Field>
          <Field label="Label CTA Sekunder">
            <input
              className={inputBase}
              value={h.secondaryCtaLabel}
              onChange={(e) => update("hero", { secondaryCtaLabel: e.target.value })}
            />
          </Field>
          <Field label="URL CTA Sekunder">
            <input
              className={inputBase}
              value={h.secondaryCtaUrl}
              onChange={(e) => update("hero", { secondaryCtaUrl: e.target.value })}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Background" className="lg:col-span-2">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Tipe Background">
            <select
              className={inputBase}
              value={h.backgroundType}
              onChange={(e) =>
                update("hero", { backgroundType: e.target.value as HeroSettings["backgroundType"] })
              }
            >
              <option value="gradient">Gradient</option>
              <option value="solid">Solid color</option>
              <option value="image">Image</option>
            </select>
          </Field>
          <Field label="Warna dasar">
            <input
              className={inputBase}
              value={h.backgroundColor}
              onChange={(e) => update("hero", { backgroundColor: e.target.value })}
              placeholder="#0b0b0b"
            />
          </Field>
          <Field label="URL Gambar" hint="Dipakai jika tipe = image.">
            <div className="flex gap-2">
              <input
                className={inputBase}
                value={h.backgroundImageUrl}
                onChange={(e) => update("hero", { backgroundImageUrl: e.target.value })}
                placeholder="https://..."
              />
              {h.backgroundImageUrl && (
                <a
                  href={h.backgroundImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-white/10 px-3 text-xs text-white/60 hover:border-white/30"
                >
                  <ImageIcon size={12} /> Lihat
                </a>
              )}
            </div>
          </Field>
          <Field label="Gradient CSS" hint="Dipakai jika tipe = gradient.">
            <textarea
              className={textareaBase}
              rows={3}
              value={h.backgroundGradient}
              onChange={(e) => update("hero", { backgroundGradient: e.target.value })}
            />
          </Field>
          <Field label="Overlay opacity (0-100)">
            <input
              type="number"
              min={0}
              max={100}
              className={inputBase}
              value={h.overlayOpacity}
              onChange={(e) => update("hero", { overlayOpacity: Number(e.target.value) })}
            />
          </Field>
          <Field label="Background opacity (0-100)">
            <input
              type="number"
              min={0}
              max={100}
              className={inputBase}
              value={h.backgroundOpacity}
              onChange={(e) => update("hero", { backgroundOpacity: Number(e.target.value) })}
            />
          </Field>
        </div>
      </SectionCard>

      <div className="lg:col-span-2">
        <SaveButton
          pending={pending}
          isActive={activeSection === section}
          onSave={() => {
            const form = document.activeElement?.closest("form") as HTMLFormElement | null;
            form?.requestSubmit();
          }}
          onReset={() => onReset(section)}
          section={section}
        />
      </div>
    </form>
  );
}

function StatsTab({
  values,
  setValues,
  pending,
  activeSection,
  onSave,
  onReset,
}: TabProps & { setValues: React.Dispatch<React.SetStateAction<Values>> }) {
  const stats = values.stats;
  const section = "stats";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(section, () => {
          const fd = new FormData();
          fd.set("__section", section);
          fd.set("stats_json", JSON.stringify(stats));
          return fd;
        });
      }}
      className="grid gap-4"
    >
      <SectionCard title="Stat / Pencapaian">
        <p className="mb-3 text-xs text-white/40">
          Tampilkan angka-angka pencapaian toko (mis. &quot;5.000+ Fans&quot;, &quot;50+ Kota&quot;).
          Maks 12 item.
        </p>
        <div className="grid gap-3">
          {stats.map((s, i) => (
            <div
              key={s.id}
              className="grid grid-cols-[1fr,1fr,auto] items-end gap-2 rounded-xl border border-white/10 bg-black/30 p-3"
            >
              <Field label={`Nilai #${i + 1}`}>
                <input
                  className={inputBase}
                  value={s.value}
                  onChange={(e) =>
                    setValues((p) => ({ ...p, stats: updateAt(p.stats, s.id, { value: e.target.value }) }))
                  }
                  placeholder="5000+"
                />
              </Field>
              <Field label="Label">
                <input
                  className={inputBase}
                  value={s.label}
                  onChange={(e) =>
                    setValues((p) => ({ ...p, stats: updateAt(p.stats, s.id, { label: e.target.value }) }))
                  }
                  placeholder="Fans terdaftar"
                />
              </Field>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setValues((p) => ({ ...p, stats: reorderButtons(p.stats, s.id, -1) }))
                  }
                  className="h-9 w-9 rounded-lg border border-white/10 text-white/60 hover:border-white/30"
                  aria-label="Naik"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setValues((p) => ({ ...p, stats: reorderButtons(p.stats, s.id, 1) }))
                  }
                  className="h-9 w-9 rounded-lg border border-white/10 text-white/60 hover:border-white/30"
                  aria-label="Turun"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setValues((p) => ({ ...p, stats: removeAt(p.stats, s.id) }))
                  }
                  className="h-9 w-9 rounded-lg border border-red-500/30 text-red-300 hover:border-red-500/60"
                  aria-label="Hapus"
                >
                  <X size={14} className="mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setValues((p) => ({
              ...p,
              stats: addId(p.stats, "stat", () => ({ value: "", label: "" })),
            }))
          }
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-white/70 hover:border-white/30"
        >
          + Tambah Stat
        </button>
      </SectionCard>
      <SaveButton
        pending={pending}
        isActive={activeSection === section}
        onSave={() => {
          const form = document.activeElement?.closest("form") as HTMLFormElement | null;
          form?.requestSubmit();
        }}
        onReset={() => onReset(section)}
        section={section}
      />
    </form>
  );
}

function TrustBadgesTab({
  values,
  setValues,
  pending,
  activeSection,
  onSave,
  onReset,
}: TabProps & { setValues: React.Dispatch<React.SetStateAction<Values>> }) {
  const badges = values.trustBadges;
  const section = "trust_badges";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(section, () => {
          const fd = new FormData();
          fd.set("__section", section);
          fd.set("trust_badges_json", JSON.stringify(badges));
          return fd;
        });
      }}
      className="grid gap-4"
    >
      <SectionCard title="Trust Badges">
        <p className="mb-3 text-xs text-white/40">
          Ikon kecil di hero/footer untuk meningkatkan kepercayaan (mis. &quot;100% Original&quot;).
        </p>
        <div className="grid gap-3">
          {badges.map((b, i) => (
            <div
              key={b.id}
              className="grid grid-cols-[1fr,1fr,auto,auto] items-end gap-2 rounded-xl border border-white/10 bg-black/30 p-3"
            >
              <Field label={`Badge #${i + 1}`}>
                <input
                  className={inputBase}
                  value={b.text}
                  onChange={(e) =>
                    setValues((p) => ({
                      ...p,
                      trustBadges: updateAt(p.trustBadges, b.id, { text: e.target.value }),
                    }))
                  }
                />
              </Field>
              <Field label="Icon">
                <select
                  className={inputBase}
                  value={b.icon}
                  onChange={(e) =>
                    setValues((p) => ({
                      ...p,
                      trustBadges: updateAt(p.trustBadges, b.id, { icon: e.target.value }),
                    }))
                  }
                >
                  {ICON_OPTIONS.map((ic) => (
                    <option key={ic} value={ic}>
                      {ic}
                    </option>
                  ))}
                </select>
              </Field>
              <Toggle
                name={`badge_enabled_${b.id}`}
                checked={b.enabled}
                label="Aktif"
              />
              <button
                type="button"
                onClick={() =>
                  setValues((p) => ({
                    ...p,
                    trustBadges: removeAt(p.trustBadges, b.id),
                  }))
                }
                className="h-9 w-9 rounded-lg border border-red-500/30 text-red-300 hover:border-red-500/60"
                aria-label="Hapus"
              >
                <X size={14} className="mx-auto" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setValues((p) => ({
              ...p,
              trustBadges: addId(p.trustBadges, "badge", () => ({
                text: "",
                icon: "ShieldCheck",
                enabled: true,
              })),
            }))
          }
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-white/70 hover:border-white/30"
        >
          + Tambah Badge
        </button>
      </SectionCard>
      <SaveButton
        pending={pending}
        isActive={activeSection === section}
        onSave={() => {
          const form = document.activeElement?.closest("form") as HTMLFormElement | null;
          form?.requestSubmit();
        }}
        onReset={() => onReset(section)}
        section={section}
      />
    </form>
  );
}

function LatestDropTab({
  values,
  update,
  pending,
  activeSection,
  onSave,
  onReset,
}: UpdatableTabProps<"latestDrop">) {
  const ld = values.latestDrop;
  const section = "latest_drop";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(section, () => {
          const fd = new FormData();
          fd.set("__section", section);
          fd.set("latestDrop_enabled", ld.enabled ? "on" : "");
          fd.set("latestDrop_title", ld.title);
          fd.set("latestDrop_description", ld.description);
          fd.set("latestDrop_ctaLabel", ld.ctaLabel);
          fd.set("latestDrop_ctaUrl", ld.ctaUrl);
          fd.set("latestDrop_limit", String(ld.limit));
          fd.set("latestDrop_backgroundColor", ld.backgroundColor);
          fd.set("latestDrop_mode", ld.mode);
          fd.set("latestDrop_manual_json", JSON.stringify(ld.manualProductIds));
          return fd;
        });
      }}
      className="grid gap-4 md:grid-cols-2"
    >
      <SectionCard title="Section Latest Drop">
        <div className="grid gap-3">
          <Toggle name="latestDrop_enabled" checked={ld.enabled} label="Aktifkan section" />
          <Field label="Judul">
            <input
              className={inputBase}
              value={ld.title}
              onChange={(e) => update("latestDrop", { title: e.target.value })}
            />
          </Field>
          <Field label="Deskripsi">
            <textarea
              className={textareaBase}
              rows={3}
              value={ld.description}
              onChange={(e) => update("latestDrop", { description: e.target.value })}
            />
          </Field>
          <Field label="Teks Tombol CTA">
            <input
              className={inputBase}
              value={ld.ctaLabel}
              onChange={(e) => update("latestDrop", { ctaLabel: e.target.value })}
            />
          </Field>
          <Field label="URL CTA">
            <input
              className={inputBase}
              value={ld.ctaUrl}
              onChange={(e) => update("latestDrop", { ctaUrl: e.target.value })}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Tampilan & Sumber">
        <div className="grid gap-3">
          <Field label="Mode Pilihan Produk">
            <select
              className={inputBase}
              value={ld.mode}
              onChange={(e) =>
                update("latestDrop", { mode: e.target.value as LatestDropSettings["mode"] })
              }
            >
              <option value="auto">Otomatis (produk terbaru)</option>
              <option value="manual">Manual (pilih ID)</option>
            </select>
          </Field>
          <Field label="Jumlah produk" hint="Hanya dipakai di mode otomatis.">
            <input
              type="number"
              min={1}
              max={24}
              className={inputBase}
              value={ld.limit}
              onChange={(e) =>
                update("latestDrop", { limit: Math.max(1, Math.min(24, Number(e.target.value))) })
              }
            />
          </Field>
          <Field label="Warna Latar">
            <input
              className={inputBase}
              value={ld.backgroundColor}
              onChange={(e) => update("latestDrop", { backgroundColor: e.target.value })}
            />
          </Field>
        </div>
      </SectionCard>

      {ld.mode === "manual" && (
        <SectionCard title="Daftar Product ID (mode manual)" className="md:col-span-2">
          <p className="mb-2 text-xs text-white/40">
            Masukkan ID produk (UUID) satu per baris, atau JSON array. Baris kosong diabaikan.
          </p>
          <textarea
            className={textareaBase}
            rows={5}
            value={ld.manualProductIds.join("\n")}
            onChange={(e) =>
              update("latestDrop", {
                manualProductIds: e.target.value
                  .split(/[\n,]+/)
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder={"uuid-1\nuuid-2\nuuid-3"}
          />
        </SectionCard>
      )}

      <div className="md:col-span-2">
        <SaveButton
          pending={pending}
          isActive={activeSection === section}
          onSave={() => {
            const form = document.activeElement?.closest("form") as HTMLFormElement | null;
            form?.requestSubmit();
          }}
          onReset={() => onReset(section)}
          section={section}
        />
      </div>
    </form>
  );
}

function SectionsTab({
  values,
  update,
  pending,
  activeSection,
  onSave,
  onReset,
}: UpdatableTabProps<"sections">) {
  const s = values.sections;
  const section = "sections";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(section, () => {
          const fd = new FormData();
          fd.set("__section", section);
          fd.set("section_marquee", s.marquee ? "on" : "");
          fd.set("section_whyWali", s.whyWali ? "on" : "");
          fd.set("section_howToOrder", s.howToOrder ? "on" : "");
          fd.set("section_cta", s.cta ? "on" : "");
          fd.set("section_faq", s.faq ? "on" : "");
          return fd;
        });
      }}
      className="grid gap-4"
    >
      <SectionCard title="Aktif/Nonaktif Section Homepage">
        <p className="mb-3 text-xs text-white/40">
          Section mana yang ingin ditampilkan di halaman utama. Nonaktifkan untuk menyembunyikan
          tanpa menghapus konten.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle name="section_marquee" checked={s.marquee} label="Marquee" />
          <Toggle name="section_whyWali" checked={s.whyWali} label="Why WALI" />
          <Toggle name="section_howToOrder" checked={s.howToOrder} label="How To Order" />
          <Toggle name="section_cta" checked={s.cta} label="CTA Banner" />
          <Toggle name="section_faq" checked={s.faq} label="FAQ" />
        </div>
      </SectionCard>
      <SaveButton
        pending={pending}
        isActive={activeSection === section}
        onSave={() => {
          const form = document.activeElement?.closest("form") as HTMLFormElement | null;
          form?.requestSubmit();
        }}
        onReset={() => onReset(section)}
        section={section}
      />
    </form>
  );
}

function MarqueeTab({
  values,
  setValues,
  pending,
  activeSection,
  onSave,
  onReset,
}: TabProps & { setValues: React.Dispatch<React.SetStateAction<Values>> }) {
  const m = values.marquee;
  const section = "marquee";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(section, () => {
          const fd = new FormData();
          fd.set("__section", section);
          fd.set("marquee_enabled", m.enabled ? "on" : "");
          fd.set("marquee_texts_json", JSON.stringify(m.texts));
          return fd;
        });
      }}
      className="grid gap-4"
    >
      <SectionCard title="Marquee / Running Text">
        <div className="mb-3">
          <Toggle name="marquee_enabled" checked={m.enabled} label="Aktifkan marquee" />
        </div>
        <Field label="Teks (satu per baris)" hint="Maks 30 baris, 60 karakter per baris.">
          <textarea
            className={textareaBase}
            rows={5}
            value={m.texts.join("\n")}
            onChange={(e) =>
              setValues((p) => ({
                ...p,
                marquee: {
                  ...p.marquee,
                  texts: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .slice(0, 30),
                },
              }))
            }
          />
        </Field>
      </SectionCard>
      <SaveButton
        pending={pending}
        isActive={activeSection === section}
        onSave={() => {
          const form = document.activeElement?.closest("form") as HTMLFormElement | null;
          form?.requestSubmit();
        }}
        onReset={() => onReset(section)}
        section={section}
      />
    </form>
  );
}

function WhyWaliTab({
  values,
  setValues,
  pending,
  activeSection,
  onSave,
  onReset,
}: TabProps & { setValues: React.Dispatch<React.SetStateAction<Values>> }) {
  const w = values.whyWali;
  const section = "why_wali";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(section, () => {
          const fd = new FormData();
          fd.set("__section", section);
          fd.set("why_enabled", w.enabled ? "on" : "");
          fd.set("why_title", w.title);
          fd.set("why_description", w.description);
          fd.set("why_items_json", JSON.stringify(w.items));
          return fd;
        });
      }}
      className="grid gap-4"
    >
      <SectionCard title="Why WALI — Header">
        <div className="grid gap-3">
          <Toggle name="why_enabled" checked={w.enabled} label="Aktifkan section" />
          <Field label="Judul">
            <input
              className={inputBase}
              value={w.title}
              onChange={(e) =>
                setValues((p) => ({ ...p, whyWali: { ...p.whyWali, title: e.target.value } }))
              }
            />
          </Field>
          <Field label="Deskripsi">
            <textarea
              className={textareaBase}
              rows={3}
              value={w.description}
              onChange={(e) =>
                setValues((p) => ({
                  ...p,
                  whyWali: { ...p.whyWali, description: e.target.value },
                }))
              }
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Item (maks 8)">
        <div className="grid gap-3">
          {w.items.map((it, i) => (
            <div
              key={it.id}
              className="rounded-xl border border-white/10 bg-black/30 p-3"
            >
              <div className="grid grid-cols-[1fr,1fr,auto] items-end gap-2">
                <Field label={`Judul #${i + 1}`}>
                  <input
                    className={inputBase}
                    value={it.title}
                    onChange={(e) =>
                      setValues((p) => ({
                        ...p,
                        whyWali: {
                          ...p.whyWali,
                          items: updateAt(p.whyWali.items, it.id, { title: e.target.value }),
                        },
                      }))
                    }
                  />
                </Field>
                <Field label="Icon">
                  <select
                    className={inputBase}
                    value={it.icon}
                    onChange={(e) =>
                      setValues((p) => ({
                        ...p,
                        whyWali: {
                          ...p.whyWali,
                          items: updateAt(p.whyWali.items, it.id, { icon: e.target.value }),
                        },
                      }))
                    }
                  >
                    {ICON_OPTIONS.map((ic) => (
                      <option key={ic} value={ic}>
                        {ic}
                      </option>
                    ))}
                  </select>
                </Field>
                <button
                  type="button"
                  onClick={() =>
                    setValues((p) => ({
                      ...p,
                      whyWali: {
                        ...p.whyWali,
                        items: removeAt(p.whyWali.items, it.id),
                      },
                    }))
                  }
                  className="h-9 w-9 rounded-lg border border-red-500/30 text-red-300 hover:border-red-500/60"
                  aria-label="Hapus"
                >
                  <X size={14} className="mx-auto" />
                </button>
              </div>
              <div className="mt-2">
                <Field label="Deskripsi">
                  <textarea
                    className={textareaBase}
                    rows={2}
                    value={it.description}
                    onChange={(e) =>
                      setValues((p) => ({
                        ...p,
                        whyWali: {
                          ...p.whyWali,
                          items: updateAt(p.whyWali.items, it.id, { description: e.target.value }),
                        },
                      }))
                    }
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setValues((p) => ({
              ...p,
              whyWali: {
                ...p.whyWali,
                items: addId(p.whyWali.items, "ww", () => ({
                  title: "",
                  description: "",
                  icon: "ShieldCheck",
                })),
              },
            }))
          }
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-white/70 hover:border-white/30"
        >
          + Tambah Item
        </button>
      </SectionCard>

      <SaveButton
        pending={pending}
        isActive={activeSection === section}
        onSave={() => {
          const form = document.activeElement?.closest("form") as HTMLFormElement | null;
          form?.requestSubmit();
        }}
        onReset={() => onReset(section)}
        section={section}
      />
    </form>
  );
}

function HowToOrderTab({
  values,
  setValues,
  pending,
  activeSection,
  onSave,
  onReset,
}: TabProps & { setValues: React.Dispatch<React.SetStateAction<Values>> }) {
  const h = values.howToOrder;
  const section = "how_to_order";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(section, () => {
          const fd = new FormData();
          fd.set("__section", section);
          fd.set("how_enabled", h.enabled ? "on" : "");
          fd.set("how_title", h.title);
          fd.set("how_description", h.description);
          fd.set("how_steps_json", JSON.stringify(h.steps));
          return fd;
        });
      }}
      className="grid gap-4"
    >
      <SectionCard title="How To Order — Header">
        <div className="grid gap-3">
          <Toggle name="how_enabled" checked={h.enabled} label="Aktifkan section" />
          <Field label="Judul">
            <input
              className={inputBase}
              value={h.title}
              onChange={(e) =>
                setValues((p) => ({ ...p, howToOrder: { ...p.howToOrder, title: e.target.value } }))
              }
            />
          </Field>
          <Field label="Deskripsi">
            <textarea
              className={textareaBase}
              rows={3}
              value={h.description}
              onChange={(e) =>
                setValues((p) => ({
                  ...p,
                  howToOrder: { ...p.howToOrder, description: e.target.value },
                }))
              }
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Steps (maks 8)">
        <div className="grid gap-3">
          {h.steps.map((it, i) => (
            <div
              key={it.id}
              className="grid grid-cols-[80px,1fr,auto] items-end gap-2 rounded-xl border border-white/10 bg-black/30 p-3"
            >
              <Field label={`No. #${i + 1}`}>
                <input
                  className={inputBase}
                  value={it.step}
                  onChange={(e) =>
                    setValues((p) => ({
                      ...p,
                      howToOrder: {
                        ...p.howToOrder,
                        steps: updateAt(p.howToOrder.steps, it.id, { step: e.target.value }),
                      },
                    }))
                  }
                  placeholder="01"
                />
              </Field>
              <Field label="Judul & Deskripsi">
                <input
                  className={`${inputBase} mb-2`}
                  value={it.title}
                  onChange={(e) =>
                    setValues((p) => ({
                      ...p,
                      howToOrder: {
                        ...p.howToOrder,
                        steps: updateAt(p.howToOrder.steps, it.id, { title: e.target.value }),
                      },
                    }))
                  }
                />
                <textarea
                  className={textareaBase}
                  rows={2}
                  value={it.description}
                  onChange={(e) =>
                    setValues((p) => ({
                      ...p,
                      howToOrder: {
                        ...p.howToOrder,
                        steps: updateAt(p.howToOrder.steps, it.id, { description: e.target.value }),
                      },
                    }))
                  }
                />
              </Field>
              <button
                type="button"
                onClick={() =>
                  setValues((p) => ({
                    ...p,
                    howToOrder: {
                      ...p.howToOrder,
                      steps: removeAt(p.howToOrder.steps, it.id),
                    },
                  }))
                }
                className="h-9 w-9 rounded-lg border border-red-500/30 text-red-300 hover:border-red-500/60"
                aria-label="Hapus"
              >
                <X size={14} className="mx-auto" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setValues((p) => ({
              ...p,
              howToOrder: {
                ...p.howToOrder,
                steps: addId(p.howToOrder.steps, "hto", () => ({
                  step: "",
                  title: "",
                  description: "",
                })),
              },
            }))
          }
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-white/70 hover:border-white/30"
        >
          + Tambah Step
        </button>
      </SectionCard>

      <SaveButton
        pending={pending}
        isActive={activeSection === section}
        onSave={() => {
          const form = document.activeElement?.closest("form") as HTMLFormElement | null;
          form?.requestSubmit();
        }}
        onReset={() => onReset(section)}
        section={section}
      />
    </form>
  );
}

function CtaTab({
  values,
  update,
  pending,
  activeSection,
  onSave,
  onReset,
}: UpdatableTabProps<"cta">) {
  const c = values.cta;
  const section = "cta";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(section, () => {
          const fd = new FormData();
          fd.set("__section", section);
          fd.set("cta_enabled", c.enabled ? "on" : "");
          fd.set("cta_title", c.title);
          fd.set("cta_description", c.description);
          fd.set("cta_primaryLabel", c.primaryLabel);
          fd.set("cta_primaryUrl", c.primaryUrl);
          fd.set("cta_secondaryLabel", c.secondaryLabel);
          fd.set("cta_secondaryUrl", c.secondaryUrl);
          return fd;
        });
      }}
      className="grid gap-4"
    >
      <SectionCard title="CTA Banner">
        <div className="grid gap-3">
          <Toggle name="cta_enabled" checked={c.enabled} label="Aktifkan CTA banner" />
          <Field label="Judul">
            <input
              className={inputBase}
              value={c.title}
              onChange={(e) => update("cta", { title: e.target.value })}
            />
          </Field>
          <Field label="Deskripsi">
            <textarea
              className={textareaBase}
              rows={3}
              value={c.description}
              onChange={(e) => update("cta", { description: e.target.value })}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Tombol CTA">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Label Primer">
            <input
              className={inputBase}
              value={c.primaryLabel}
              onChange={(e) => update("cta", { primaryLabel: e.target.value })}
            />
          </Field>
          <Field label="URL Primer">
            <input
              className={inputBase}
              value={c.primaryUrl}
              onChange={(e) => update("cta", { primaryUrl: e.target.value })}
            />
          </Field>
          <Field label="Label Sekunder">
            <input
              className={inputBase}
              value={c.secondaryLabel}
              onChange={(e) => update("cta", { secondaryLabel: e.target.value })}
            />
          </Field>
          <Field label="URL Sekunder">
            <input
              className={inputBase}
              value={c.secondaryUrl}
              onChange={(e) => update("cta", { secondaryUrl: e.target.value })}
            />
          </Field>
        </div>
      </SectionCard>

      <SaveButton
        pending={pending}
        isActive={activeSection === section}
        onSave={() => {
          const form = document.activeElement?.closest("form") as HTMLFormElement | null;
          form?.requestSubmit();
        }}
        onReset={() => onReset(section)}
        section={section}
      />
    </form>
  );
}

function FaqTab({
  values,
  setValues,
  pending,
  activeSection,
  onSave,
  onReset,
}: TabProps & { setValues: React.Dispatch<React.SetStateAction<Values>> }) {
  const f = values.faq;
  const section = "faq";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(section, () => {
          const fd = new FormData();
          fd.set("__section", section);
          fd.set("faq_enabled", f.enabled ? "on" : "");
          fd.set("faq_title", f.title);
          fd.set("faq_description", f.description);
          fd.set("faq_items_json", JSON.stringify(f.items));
          return fd;
        });
      }}
      className="grid gap-4"
    >
      <SectionCard title="FAQ — Header">
        <div className="grid gap-3">
          <Toggle name="faq_enabled" checked={f.enabled} label="Aktifkan section" />
          <Field label="Judul">
            <input
              className={inputBase}
              value={f.title}
              onChange={(e) =>
                setValues((p) => ({ ...p, faq: { ...p.faq, title: e.target.value } }))
              }
            />
          </Field>
          <Field label="Deskripsi">
            <textarea
              className={textareaBase}
              rows={2}
              value={f.description}
              onChange={(e) =>
                setValues((p) => ({ ...p, faq: { ...p.faq, description: e.target.value } }))
              }
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Daftar Pertanyaan (maks 30)">
        <div className="grid gap-3">
          {f.items.map((it, i) => (
            <div key={it.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="grid grid-cols-[1fr,auto] items-end gap-2">
                <Field label={`Pertanyaan #${i + 1}`}>
                  <input
                    className={inputBase}
                    value={it.question}
                    onChange={(e) =>
                      setValues((p) => ({
                        ...p,
                        faq: {
                          ...p.faq,
                          items: updateAt(p.faq.items, it.id, { question: e.target.value }),
                        },
                      }))
                    }
                  />
                </Field>
                <button
                  type="button"
                  onClick={() =>
                    setValues((p) => ({
                      ...p,
                      faq: { ...p.faq, items: removeAt(p.faq.items, it.id) },
                    }))
                  }
                  className="h-9 w-9 rounded-lg border border-red-500/30 text-red-300 hover:border-red-500/60"
                  aria-label="Hapus"
                >
                  <X size={14} className="mx-auto" />
                </button>
              </div>
              <div className="mt-2">
                <Field label="Jawaban">
                  <textarea
                    className={textareaBase}
                    rows={2}
                    value={it.answer}
                    onChange={(e) =>
                      setValues((p) => ({
                        ...p,
                        faq: {
                          ...p.faq,
                          items: updateAt(p.faq.items, it.id, { answer: e.target.value }),
                        },
                      }))
                    }
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setValues((p) => ({
              ...p,
              faq: {
                ...p.faq,
                items: addId(p.faq.items, "faq", () => ({ question: "", answer: "" })),
              },
            }))
          }
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-white/70 hover:border-white/30"
        >
          + Tambah Pertanyaan
        </button>
      </SectionCard>

      <SaveButton
        pending={pending}
        isActive={activeSection === section}
        onSave={() => {
          const form = document.activeElement?.closest("form") as HTMLFormElement | null;
          form?.requestSubmit();
        }}
        onReset={() => onReset(section)}
        section={section}
      />
    </form>
  );
}

function FooterTab({
  values,
  setValues,
  pending,
  activeSection,
  onSave,
  onReset,
}: TabProps & { setValues: React.Dispatch<React.SetStateAction<Values>> }) {
  const f = values.footer;
  const section = "footer";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(section, () => {
          const fd = new FormData();
          fd.set("__section", section);
          fd.set("footer_logoUrl", f.logoUrl);
          fd.set("footer_logoText", f.logoText);
          fd.set("footer_brandDescription", f.brandDescription);
          fd.set("footer_address", f.address);
          fd.set("footer_email", f.email);
          fd.set("footer_whatsapp", f.whatsapp);
          fd.set("footer_instagram", f.instagram);
          fd.set("footer_tiktok", f.tiktok);
          fd.set("footer_youtube", f.youtube);
          fd.set("footer_copyrightText", f.copyrightText);
          fd.set("footer_links_json", JSON.stringify(f.links));
          return fd;
        });
      }}
      className="grid gap-4 md:grid-cols-2"
    >
      <SectionCard title="Brand & Logo">
        <div className="grid gap-3">
          <Field label="Logo URL">
            <input
              className={inputBase}
              value={f.logoUrl}
              onChange={(e) =>
                setValues((p) => ({ ...p, footer: { ...p.footer, logoUrl: e.target.value } }))
              }
            />
          </Field>
          <Field label="Teks Logo">
            <input
              className={inputBase}
              value={f.logoText}
              onChange={(e) =>
                setValues((p) => ({ ...p, footer: { ...p.footer, logoText: e.target.value } }))
              }
            />
          </Field>
          <Field label="Deskripsi Brand">
            <textarea
              className={textareaBase}
              rows={3}
              value={f.brandDescription}
              onChange={(e) =>
                setValues((p) => ({ ...p, footer: { ...p.footer, brandDescription: e.target.value } }))
              }
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Kontak">
        <div className="grid gap-3">
          <Field label="Alamat">
            <input
              className={inputBase}
              value={f.address}
              onChange={(e) =>
                setValues((p) => ({ ...p, footer: { ...p.footer, address: e.target.value } }))
              }
            />
          </Field>
          <Field label="Email">
            <input
              className={inputBase}
              value={f.email}
              onChange={(e) =>
                setValues((p) => ({ ...p, footer: { ...p.footer, email: e.target.value } }))
              }
            />
          </Field>
          <Field label="WhatsApp">
            <input
              className={inputBase}
              value={f.whatsapp}
              onChange={(e) =>
                setValues((p) => ({ ...p, footer: { ...p.footer, whatsapp: e.target.value } }))
              }
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Sosial Media">
        <div className="grid gap-3">
          <Field label="Instagram (URL)">
            <input
              className={inputBase}
              value={f.instagram}
              onChange={(e) =>
                setValues((p) => ({ ...p, footer: { ...p.footer, instagram: e.target.value } }))
              }
            />
          </Field>
          <Field label="TikTok (URL)">
            <input
              className={inputBase}
              value={f.tiktok}
              onChange={(e) =>
                setValues((p) => ({ ...p, footer: { ...p.footer, tiktok: e.target.value } }))
              }
            />
          </Field>
          <Field label="YouTube (URL)">
            <input
              className={inputBase}
              value={f.youtube}
              onChange={(e) =>
                setValues((p) => ({ ...p, footer: { ...p.footer, youtube: e.target.value } }))
              }
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Copyright & Link">
        <div className="grid gap-3">
          <Field label="Teks Copyright">
            <input
              className={inputBase}
              value={f.copyrightText}
              onChange={(e) =>
                setValues((p) => ({ ...p, footer: { ...p.footer, copyrightText: e.target.value } }))
              }
            />
          </Field>
          <Field label="Footer Links (satu per baris, format: label|url)" hint="Maks 12 link.">
            <textarea
              className={textareaBase}
              rows={4}
              value={f.links.map((l) => `${l.label}|${l.url}`).join("\n")}
              onChange={(e) =>
                setValues((p) => ({
                  ...p,
                  footer: {
                    ...p.footer,
                    links: e.target.value
                      .split("\n")
                      .map((line, idx) => {
                        const [label, url] = line.split("|").map((s) => s?.trim() ?? "");
                        return { id: `l-${idx}-${Math.random().toString(36).slice(2, 6)}`, label, url };
                      })
                      .filter((l) => l.label && l.url)
                      .slice(0, 12),
                  },
                }))
              }
              placeholder="Home|/\nProducts|/products"
            />
          </Field>
        </div>
      </SectionCard>

      <SaveButton
        pending={pending}
        isActive={activeSection === section}
        onSave={() => {
          const form = document.activeElement?.closest("form") as HTMLFormElement | null;
          form?.requestSubmit();
        }}
        onReset={() => onReset(section)}
        section={section}
      />
    </form>
  );
}

function SeoTab({
  values,
  update,
  pending,
  activeSection,
  onSave,
  onReset,
}: UpdatableTabProps<"seo">) {
  const s = values.seo;
  const section = "seo";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(section, () => {
          const fd = new FormData();
          fd.set("__section", section);
          fd.set("seo_metaTitle", s.metaTitle);
          fd.set("seo_metaDescription", s.metaDescription);
          fd.set("seo_ogTitle", s.ogTitle);
          fd.set("seo_ogDescription", s.ogDescription);
          fd.set("seo_ogImage", s.ogImage);
          return fd;
        });
      }}
      className="grid gap-4"
    >
      <SectionCard title="Meta Tags (SEO)">
        <div className="grid gap-3">
          <Field label="Meta Title" hint="Maks 60-70 karakter direkomendasikan.">
            <input
              className={inputBase}
              value={s.metaTitle}
              onChange={(e) => update("seo", { metaTitle: e.target.value })}
            />
          </Field>
          <Field label="Meta Description" hint="Maks 150-160 karakter.">
            <textarea
              className={textareaBase}
              rows={3}
              value={s.metaDescription}
              onChange={(e) => update("seo", { metaDescription: e.target.value })}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="OpenGraph (Sosial Media)">
        <div className="grid gap-3">
          <Field label="OG Title">
            <input
              className={inputBase}
              value={s.ogTitle}
              onChange={(e) => update("seo", { ogTitle: e.target.value })}
            />
          </Field>
          <Field label="OG Description">
            <textarea
              className={textareaBase}
              rows={2}
              value={s.ogDescription}
              onChange={(e) => update("seo", { ogDescription: e.target.value })}
            />
          </Field>
          <Field label="OG Image URL" hint="Disarankan 1200x630px.">
            <input
              className={inputBase}
              value={s.ogImage}
              onChange={(e) => update("seo", { ogImage: e.target.value })}
              placeholder="https://..."
            />
          </Field>
        </div>
      </SectionCard>

      <SaveButton
        pending={pending}
        isActive={activeSection === section}
        onSave={() => {
          const form = document.activeElement?.closest("form") as HTMLFormElement | null;
          form?.requestSubmit();
        }}
        onReset={() => onReset(section)}
        section={section}
      />
    </form>
  );
}
