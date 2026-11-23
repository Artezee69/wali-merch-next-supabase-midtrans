"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronDown,
  Loader2,
  RotateCcw,
  Save,
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
import {
  AdminButton,
  Field,
  Pill,
  Toggle,
} from "@/components/admin/ui";

type Group = "store_general" | "homepage_latest_drop" | "bank";

type BankSettings = {
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
};

type Saved = {
  store_general: StoreGeneralSettings;
  homepage_latest_drop: LatestDropSettings;
  bank: BankSettings;
};

type Props = {
  initial: Saved;
  products: { id: string; name: string }[];
  initialTab?: Group;
};

const TABS: { key: Group; label: string }[] = [
  { key: "store_general", label: "Identitas Toko" },
  { key: "homepage_latest_drop", label: "Latest Drop" },
  { key: "bank", label: "Pembayaran" },
];

const inp = "ad-input";

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
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex flex-wrap border-b border-[var(--ad-border)]">
        {TABS.map((t) => {
          const isDirty =
            JSON.stringify(saved[t.key]) !== JSON.stringify(draft[t.key]);
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`relative -mb-px flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold transition ${
                active ? "text-[var(--ad-accent)]" : "text-[var(--ad-text-2)] hover:text-[var(--ad-text)]"
              } ${active ? "" : "border-b-2 border-transparent"}`}
              style={
                active
                  ? {
                      borderBottom: "2px solid",
                      borderImage: "linear-gradient(90deg, #4f46e5, #7c3aed) 1",
                    }
                  : undefined
              }
            >
              {t.label}
              {isDirty && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-white" : "bg-[var(--ad-amber)]"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Unsaved banner */}
      {dirty && (
        <div className="ad-alert ad-alert-warn flex-wrap">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <div className="flex-1">Ada perubahan yang belum disimpan.</div>
          <button
            type="button"
            onClick={() => {
              (Object.keys(draft) as Group[]).forEach((k) => {
                if (JSON.stringify(saved[k]) !== JSON.stringify(draft[k])) {
                  resetGroup(k);
                }
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#fde68a] px-3 py-1 text-[11px] font-semibold transition hover:bg-amber-50"
          >
            <RotateCcw size={11} /> Reset semua
          </button>
        </div>
      )}

      {/* Tab content */}
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

      {activeTab === "bank" && (
        <BankSection
          value={draft.bank}
          saved={saved.bank}
          onChange={(v) => setGroup("bank", v)}
          onSave={() => saveGroup("bank")}
          onReset={() => resetGroup("bank")}
          saving={saving === "bank"}
        />
      )}
    </div>
  );
}

// ============== Reusable bits ==============

function SectionCard({
  title,
  badge,
  accent = "#2563eb",
  children,
}: {
  title: string;
  badge?: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="ad-card mb-4"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div className="flex items-center gap-2 border-b border-[var(--ad-border-soft)] px-4 py-3">
        {badge && <Pill tone="accent">{badge}</Pill>}
        <h3 className="text-[13px] font-semibold text-[var(--ad-text)]">{title}</h3>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

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
    <div
      className={
        isDirty
          ? "sticky bottom-0 z-10 flex flex-col gap-2 rounded-lg border border-[var(--ad-border)] bg-white/95 p-3 shadow-[0_-4px_16px_rgba(16,24,40,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-end"
          : "flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end"
      }
    >
      <AdminButton
        variant="secondary"
        onClick={onReset}
        disabled={saving || !isDirty}
      >
        <RotateCcw size={12} /> Reset
      </AdminButton>
      <AdminButton variant="primary" onClick={onSave} disabled={saving || !isDirty}>
        {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
        {saveLabel}
      </AdminButton>
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
    <div>
      <SectionCard title="Identitas & Kontak" badge="1" accent="#2563eb">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nama Toko" required hint="Ditampilkan di title, footer, dan struk.">
            <input
              className={inp}
              value={value.storeName}
              onChange={(e) => onChange({ ...value, storeName: e.target.value })}
            />
          </Field>
          <Field label="Email Toko" hint="Email customer service publik.">
            <input
              className={inp}
              type="email"
              value={value.storeEmail}
              onChange={(e) => onChange({ ...value, storeEmail: e.target.value })}
            />
          </Field>
          <Field label="Nomor WhatsApp Admin" hint="Format internasional (cth: +6285134894580).">
            <input
              className={inp}
              value={value.storeWhatsapp}
              onChange={(e) =>
                onChange({ ...value, storeWhatsapp: e.target.value })
              }
            />
          </Field>
          <Field label="Alamat Toko" hint="Ditampilkan di footer dan invoice.">
            <textarea
              className={inp + " resize-none"}
              rows={2}
              value={value.storeAddress}
              onChange={(e) =>
                onChange({ ...value, storeAddress: e.target.value })
              }
            />
          </Field>
          <Field label="Batas Stok Rendah" hint="Varian dengan stok di bawah angka ini akan diperingatkan.">
            <input
              className={inp}
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
      </SectionCard>

      <SectionCard title="Kebijakan" badge="2" accent="#d97706">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Kebijakan Privasi">
            <textarea
              className={inp + " resize-y"}
              rows={6}
              value={value.privacyPolicy}
              onChange={(e) =>
                onChange({ ...value, privacyPolicy: e.target.value })
              }
            />
          </Field>
          <Field label="Syarat Layanan">
            <textarea
              className={inp + " resize-y"}
              rows={6}
              value={value.termsOfService}
              onChange={(e) =>
                onChange({ ...value, termsOfService: e.target.value })
              }
            />
          </Field>
        </div>
      </SectionCard>

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
  const isOpen = (id: string) => open[id] ?? true;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-[var(--ad-text)]">
            Latest Drop
          </h2>
          <p className="text-[12px] text-[var(--ad-text-3)]">
            Section produk di bawah hero.
          </p>
        </div>
        <Toggle
          value={value.enabled}
          onChange={(v) => onChange({ ...value, enabled: v })}
          label="Tampilkan Section"
        />
      </div>

      <div className="ad-card mb-4" style={{ borderLeft: "4px solid #7c3aed" }}>
        <button
          type="button"
          onClick={() => setOpen((o) => ({ ...o, latest_drop_main: !isOpen("latest_drop_main") }))}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-[var(--ad-surface-2)]"
        >
          <div className="flex items-center gap-2">
            <Pill tone="accent">1</Pill>
            <span className="text-[13px] font-semibold text-[var(--ad-text)]">
              Konten Utama
            </span>
          </div>
          <ChevronDown
            size={14}
            className={`text-[var(--ad-text-3)] transition-transform ${isOpen("latest_drop_main") ? "rotate-180" : ""}`}
          />
        </button>
        {isOpen("latest_drop_main") && (
          <div className="border-t border-[var(--ad-border-soft)] p-4 sm:p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Judul">
                <input
                  className={inp}
                  value={value.title}
                  onChange={(e) => onChange({ ...value, title: e.target.value })}
                />
              </Field>
              <Field label="Deskripsi">
                <input
                  className={inp}
                  value={value.description}
                  onChange={(e) =>
                    onChange({ ...value, description: e.target.value })
                  }
                />
              </Field>
              <Field label="Teks Tombol">
                <input
                  className={inp}
                  value={value.ctaLabel}
                  onChange={(e) =>
                    onChange({ ...value, ctaLabel: e.target.value })
                  }
                />
              </Field>
              <Field label="URL Tombol">
                <input
                  className={inp}
                  value={value.ctaUrl}
                  onChange={(e) => onChange({ ...value, ctaUrl: e.target.value })}
                />
              </Field>
              <Field label="Jumlah Produk" hint="Maks 12.">
                <input
                  className={inp}
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
                  className={inp}
                  value={value.backgroundColor}
                  onChange={(e) =>
                    onChange({ ...value, backgroundColor: e.target.value })
                  }
                />
              </Field>
            </div>
          </div>
        )}
      </div>

      <div className="ad-card mb-4" style={{ borderLeft: "4px solid #0891b2" }}>
        <button
          type="button"
          onClick={() => setOpen((o) => ({ ...o, latest_drop_mode: !isOpen("latest_drop_mode") }))}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-[var(--ad-surface-2)]"
        >
          <div className="flex items-center gap-2">
            <Pill tone="accent">2</Pill>
            <span className="text-[13px] font-semibold text-[var(--ad-text)]">
              Mode Produk
            </span>
          </div>
          <ChevronDown
            size={14}
            className={`text-[var(--ad-text-3)] transition-transform ${isOpen("latest_drop_mode") ? "rotate-180" : ""}`}
          />
        </button>
        {isOpen("latest_drop_mode") && (
          <div className="border-t border-[var(--ad-border-soft)] p-4 sm:p-5">
            <Field label="Sumber Produk">
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onChange({ ...value, mode: "auto" })}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    value.mode === "auto"
                      ? "border-[var(--ad-accent)] bg-[var(--ad-accent-soft)]"
                      : "border-[var(--ad-border)] bg-white hover:bg-[var(--ad-surface-2)]"
                  }`}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--ad-accent)]">
                    Otomatis
                  </div>
                  <p className="mt-1 text-[12px] text-[var(--ad-text-3)]">
                    Tampilkan produk terbaru dari database.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...value, mode: "manual" })}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    value.mode === "manual"
                      ? "border-[var(--ad-accent)] bg-[var(--ad-accent-soft)]"
                      : "border-[var(--ad-border)] bg-white hover:bg-[var(--ad-surface-2)]"
                  }`}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--ad-accent)]">
                    Manual
                  </div>
                  <p className="mt-1 text-[12px] text-[var(--ad-text-3)]">
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
                  <div className="ad-inset max-h-64 space-y-1.5 overflow-y-auto p-2">
                    {products.length === 0 && (
                      <p className="p-2 text-[12px] text-[var(--ad-text-3)]">
                        Belum ada produk di database.
                      </p>
                    )}
                    {products.map((p) => {
                      const selected = value.manualProductIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-[12.5px] transition ${
                            selected
                              ? "border-[var(--ad-accent)] bg-[var(--ad-accent-soft)] text-[var(--ad-text)]"
                              : "border-[var(--ad-border)] bg-white text-[var(--ad-text-2)] hover:border-[#cfd4dd]"
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
                            className="ad-checkbox"
                          />
                          <span className="font-semibold">{p.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </Field>
              </div>
            )}
          </div>
        )}
      </div>

      <SectionActions
        onSave={onSave}
        onReset={onReset}
        saving={saving}
        isDirty={isDirty}
      />
    </div>
  );
}

function BankSection({
  value,
  saved,
  onChange,
  onSave,
  onReset,
  saving,
}: {
  value: BankSettings;
  saved: BankSettings;
  onChange: (v: BankSettings) => void;
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
}) {
  const isDirty = JSON.stringify(value) !== JSON.stringify(saved);
  return (
    <div>
      <SectionCard title="Pembayaran Manual" accent="#16a34a">
        <p className="mb-4 text-[12.5px] leading-5 text-[var(--ad-text-3)]">
          Info rekening untuk pembayaran transfer bank. Customer akan melihat
          data ini di halaman pembayaran.
        </p>
        <div className="space-y-4">
          <Field
            label="Nama Bank"
            required
            hint="Contoh: BCA, BRI, Mandiri, BNI."
          >
            <input
              className={inp}
              value={value.bankName}
              placeholder="BCA"
              onChange={(e) => onChange({ ...value, bankName: e.target.value })}
            />
          </Field>
          <Field
            label="Nomor Rekening"
            required
            hint="Tampilkan ke customer saat pembayaran manual."
          >
            <input
              className={inp}
              value={value.bankAccountNumber}
              placeholder="0000000000"
              onChange={(e) =>
                onChange({ ...value, bankAccountNumber: e.target.value })
              }
            />
          </Field>
          <Field label="Nama Pemilik Rekening" hint="Nama yang terdaftar di bank.">
            <input
              className={inp}
              value={value.bankAccountHolder}
              placeholder="WALI Merch"
              onChange={(e) =>
                onChange({ ...value, bankAccountHolder: e.target.value })
              }
            />
          </Field>
        </div>
      </SectionCard>

      <SectionActions
        onSave={onSave}
        onReset={onReset}
        saving={saving}
        isDirty={isDirty}
      />
    </div>
  );
}
