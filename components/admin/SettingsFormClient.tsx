"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import type {
  StoreGeneralSettings,
  LatestDropSettings,
} from "@/lib/storeSettings";
import {
  DEFAULT_GENERAL,
  DEFAULT_LATEST_DROP,
} from "@/lib/storeSettings";

type Group = "store_general" | "homepage_latest_drop";

type Saved = {
  store_general: StoreGeneralSettings;
  homepage_latest_drop: LatestDropSettings;
};

type Props = {
  initial: Saved;
  products: { id: string; name: string }[];
  initialTab?: Group;
};

const TABS: { key: Group; label: string }[] = [
  { key: "store_general", label: "Identitas Toko" },
  { key: "homepage_latest_drop", label: "Latest Drop" },
];

export default function SettingsFormClient({ initial, products, initialTab }: Props) {
  const router = useRouter();
  const { show } = useToast();
  const [activeTab, setActiveTab] = useState<Group>(initialTab ?? "store_general");
  const [saved, setSaved] = useState<Saved>(initial);
  const [draft, setDraft] = useState<Saved>(initial);
  const [openAccordion, setOpenAccordion] = useState<Record<string, boolean>>({
    general_identity: true,
    general_policies: true,
    latest_drop_main: true,
    latest_drop_mode: true,
  });
  const [saving, setSaving] = useState<Group | null>(null);

  const dirty = useMemo(() => {
    return (Object.keys(saved) as Group[]).some(
      (k) => JSON.stringify(saved[k]) !== JSON.stringify(draft[k])
    );
  }, [saved, draft]);

  // Warn user when leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const saveGroup = useCallback(
    async (group: Group) => {
      setSaving(group);
      try {
        const res = await fetch("/api/admin/settings/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ group, value: draft[group] }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `HTTP ${res.status}`);
        }
        setSaved((s) => ({ ...s, [group]: draft[group] }));
        show(`Pengaturan ${group.replace(/_/g, " ")} berhasil disimpan.`, "success");
        router.refresh();
      } catch (e) {
        show(e instanceof Error ? e.message : "Unknown error", "error");
      } finally {
        setSaving(null);
      }
    },
    [draft, router, show]
  );

  const resetGroup = useCallback(
    (group: Group) => {
      setDraft((d) => ({ ...d, [group]: saved[group] }));
    },
    [saved]
  );

  const setGroup = useCallback(
    <K extends Group>(group: K, value: Saved[K]) => {
      setDraft((d) => ({ ...d, [group]: value }));
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
        {TABS.map((t) => {
          const isDirty =
            JSON.stringify(saved[t.key]) !== JSON.stringify(draft[t.key]);
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-[11px] font-black uppercase tracking-wider transition ${
                active
                  ? "bg-[#d7ff53] text-black"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              {t.label}
              {isDirty && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-black" : "bg-yellow-400"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Unsaved banner */}
      {dirty && (
        <div className="flex flex-col gap-2 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} />
            Ada perubahan yang belum disimpan.
          </div>
          <button
            type="button"
            onClick={() => {
              (Object.keys(draft) as Group[]).forEach((k) => {
                if (JSON.stringify(saved[k]) !== JSON.stringify(draft[k])) {
                  resetGroup(k);
                }
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-wider hover:bg-yellow-500/10"
          >
            <RotateCcw size={11} /> Reset semua
          </button>
        </div>
      )}

      {/* Tab content */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-6">
        {activeTab === "store_general" && (
          <GeneralSection
            value={draft.store_general}
            saved={saved.store_general}
            onChange={(v) => setGroup("store_general", v)}
            onSave={() => saveGroup("store_general")}
            onReset={() => resetGroup("store_general")}
            saving={saving === "store_general"}
          />
        )}

        {activeTab === "homepage_latest_drop" && (
          <LatestDropSection
            value={draft.homepage_latest_drop}
            onChange={(v) => setGroup("homepage_latest_drop", v)}
            onSave={() => saveGroup("homepage_latest_drop")}
            onReset={() => resetGroup("homepage_latest_drop")}
            saving={saving === "homepage_latest_drop"}
            isDirty={
              JSON.stringify(saved.homepage_latest_drop) !==
              JSON.stringify(draft.homepage_latest_drop)
            }
            products={products}
            open={openAccordion}
            setOpen={setOpenAccordion}
          />
        )}
      </div>
    </div>
  );
}

// ============== Reusable bits ==============

function SectionActions({
  onSave,
  onReset,
  saving,
  isDirty,
  saveLabel = "Simpan",
}: {
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
  isDirty: boolean;
  saveLabel?: string;
}) {
  return (
    <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      <button
        type="button"
        onClick={onReset}
        disabled={saving || !isDirty}
        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white/60 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <RotateCcw size={12} /> Reset
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving || !isDirty}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d7ff53] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
        {saveLabel}
      </button>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-white/35">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#d7ff53]";

function Toggle({
  value,
  onChange,
  label,
  hint,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
      <div className="min-w-0">
        {label && (
          <p className="text-[11px] font-black uppercase tracking-wider text-white/70">
            {label}
          </p>
        )}
        {hint && <p className="text-[10px] text-white/40">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
          value
            ? "border-[#d7ff53] bg-[#d7ff53]"
            : "border-white/15 bg-white/5"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
            value ? "left-5 bg-black" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function Accordion({
  id,
  open,
  setOpen,
  title,
  badge,
  children,
}: {
  id: string;
  open: Record<string, boolean>;
  setOpen: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  const isOpen = open[id] ?? true;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((o) => ({ ...o, [id]: !isOpen }))}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left md:px-5"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d7ff53]">
            {badge ?? "Section"}
          </span>
          <span className="text-sm font-black uppercase tracking-tight text-white/85">
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp size={16} className="text-white/50" />
        ) : (
          <ChevronDown size={16} className="text-white/50" />
        )}
      </button>
      {isOpen && (
        <div className="border-t border-white/10 p-4 md:p-5">{children}</div>
      )}
    </div>
  );
}

// ============== Sections ==============

function GeneralSection({
  value,
  onChange,
  onSave,
  onReset,
  saving,
  saved,
}: {
  value: StoreGeneralSettings;
  saved: StoreGeneralSettings;
  onChange: (v: StoreGeneralSettings) => void;
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
}) {
  const isDirty = JSON.stringify(value) !== JSON.stringify(saved);
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-base font-black uppercase tracking-tight text-white">
          Identitas Toko
        </h2>
        <p className="text-[11px] text-white/45">
          Identitas toko, kontak, dan kebijakan. Field ini juga dipakai sebagai
          fallback untuk alamat/email/WhatsApp di footer.
        </p>
      </div>

      <Accordion
        id="general_identity"
        open={{ general_identity: true }}
        setOpen={() => {}}
        title="Identitas & Kontak"
        badge="1"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nama Toko" required hint="Ditampilkan di title, footer, dan struk.">
            <input
              className={inputClass}
              value={value.storeName}
              onChange={(e) => onChange({ ...value, storeName: e.target.value })}
            />
          </Field>
          <Field label="Email Toko" hint="Email customer service publik.">
            <input
              className={inputClass}
              type="email"
              value={value.storeEmail}
              onChange={(e) => onChange({ ...value, storeEmail: e.target.value })}
            />
          </Field>
          <Field
            label="Nomor WhatsApp Admin"
            hint="Format internasional (cth: +6281234567890)."
          >
            <input
              className={inputClass}
              value={value.storeWhatsapp}
              onChange={(e) =>
                onChange({ ...value, storeWhatsapp: e.target.value })
              }
            />
          </Field>
          <Field label="Alamat Toko" hint="Ditampilkan di footer dan invoice.">
            <textarea
              className={inputClass + " resize-none"}
              rows={2}
              value={value.storeAddress}
              onChange={(e) =>
                onChange({ ...value, storeAddress: e.target.value })
              }
            />
          </Field>
          <Field
            label="Batas Stok Rendah"
            hint="Varian dengan stok di bawah angka ini akan diperingatkan."
          >
            <input
              className={inputClass}
              type="number"
              min={0}
              max={999}
              value={value.lowStockThreshold}
              onChange={(e) =>
                onChange({
                  ...value,
                  lowStockThreshold: Math.max(0, Number(e.target.value) || 0),
                })
              }
            />
          </Field>
        </div>
      </Accordion>

      <Accordion
        id="general_policies"
        open={{ general_policies: true }}
        setOpen={() => {}}
        title="Kebijakan"
        badge="2"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Kebijakan Privasi">
            <textarea
              className={inputClass + " resize-y"}
              rows={6}
              value={value.privacyPolicy}
              onChange={(e) =>
                onChange({ ...value, privacyPolicy: e.target.value })
              }
            />
          </Field>
          <Field label="Syarat Layanan">
            <textarea
              className={inputClass + " resize-y"}
              rows={6}
              value={value.termsOfService}
              onChange={(e) =>
                onChange({ ...value, termsOfService: e.target.value })
              }
            />
          </Field>
        </div>
      </Accordion>

      <SectionActions
        onSave={onSave}
        onReset={onReset}
        saving={saving}
        isDirty={isDirty}
      />
    </div>
  );
}

function LatestDropSection({
  value,
  onChange,
  onSave,
  onReset,
  saving,
  isDirty,
  products,
  open,
  setOpen,
}: {
  value: LatestDropSettings;
  onChange: (v: LatestDropSettings) => void;
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
  isDirty: boolean;
  products: { id: string; name: string }[];
  open: Record<string, boolean>;
  setOpen: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  return (
    <div className="space-y-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black uppercase tracking-tight text-white">
            Latest Drop
          </h2>
          <p className="text-[11px] text-white/45">
            Section produk di bawah hero.
          </p>
        </div>
        <Toggle
          value={value.enabled}
          onChange={(v) => onChange({ ...value, enabled: v })}
          label="Tampilkan Section"
        />
      </div>

      <Accordion
        id="latest_drop_main"
        open={open}
        setOpen={setOpen}
        title="Konten Utama"
        badge="1"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Judul">
            <input
              className={inputClass}
              value={value.title}
              onChange={(e) => onChange({ ...value, title: e.target.value })}
            />
          </Field>
          <Field label="Deskripsi">
            <input
              className={inputClass}
              value={value.description}
              onChange={(e) =>
                onChange({ ...value, description: e.target.value })
              }
            />
          </Field>
          <Field label="Teks Tombol">
            <input
              className={inputClass}
              value={value.ctaLabel}
              onChange={(e) =>
                onChange({ ...value, ctaLabel: e.target.value })
              }
            />
          </Field>
          <Field label="URL Tombol">
            <input
              className={inputClass}
              value={value.ctaUrl}
              onChange={(e) => onChange({ ...value, ctaUrl: e.target.value })}
            />
          </Field>
          <Field label="Jumlah Produk" hint="Maks 12.">
            <input
              className={inputClass}
              type="number"
              min={1}
              max={12}
              value={value.limit}
              onChange={(e) =>
                onChange({
                  ...value,
                  limit: Math.max(1, Math.min(12, Number(e.target.value) || 1)),
                })
              }
            />
          </Field>
          <Field label="Warna Background" hint="Hex. Mis. #0b0b0b">
            <input
              className={inputClass}
              value={value.backgroundColor}
              onChange={(e) =>
                onChange({ ...value, backgroundColor: e.target.value })
              }
            />
          </Field>
        </div>
      </Accordion>

      <Accordion
        id="latest_drop_mode"
        open={open}
        setOpen={setOpen}
        title="Mode Produk"
        badge="2"
      >
        <Field label="Sumber Produk">
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onChange({ ...value, mode: "auto" })}
              className={`rounded-xl border px-4 py-3 text-left text-xs font-semibold transition ${
                value.mode === "auto"
                  ? "border-[#d7ff53] bg-[#d7ff53]/10 text-white"
                  : "border-white/10 bg-black/30 text-white/60 hover:border-white/30"
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-widest text-[#d7ff53]">
                Otomatis
              </div>
              <p className="mt-1 text-[11px] text-white/50">
                Tampilkan produk terbaru dari database.
              </p>
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...value, mode: "manual" })}
              className={`rounded-xl border px-4 py-3 text-left text-xs font-semibold transition ${
                value.mode === "manual"
                  ? "border-[#d7ff53] bg-[#d7ff53]/10 text-white"
                  : "border-white/10 bg-black/30 text-white/60 hover:border-white/30"
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-widest text-[#d7ff53]">
                Manual
              </div>
              <p className="mt-1 text-[11px] text-white/50">
                Pilih produk sendiri sesuai urutan.
              </p>
            </button>
          </div>
        </Field>

        {value.mode === "manual" && (
          <div className="mt-4">
            <Field
              label="Produk Pilihan"
              hint="Pilih dari daftar. Urutan = urutan tampil."
            >
              <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-2">
                {products.length === 0 && (
                  <p className="p-2 text-[11px] text-white/40">
                    Belum ada produk di database.
                  </p>
                )}
                {products.map((p) => {
                  const selected = value.manualProductIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                        selected
                          ? "border-[#d7ff53] bg-[#d7ff53]/10"
                          : "border-white/10 bg-black/20 hover:border-white/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => {
                          const set = new Set(value.manualProductIds);
                          if (e.target.checked) set.add(p.id);
                          else set.delete(p.id);
                          onChange({
                            ...value,
                            manualProductIds: Array.from(set),
                          });
                        }}
                        className="h-3.5 w-3.5"
                      />
                      <span className="font-semibold">{p.name}</span>
                    </label>
                  );
                })}
              </div>
            </Field>
          </div>
        )}
      </Accordion>

      <SectionActions
        onSave={onSave}
        onReset={onReset}
        saving={saving}
        isDirty={isDirty}
      />
    </div>
  );
}
