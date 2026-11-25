"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Building2,
  Calculator,
  Loader2,
  Package,
  Palette,
  Plus,
  Search,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { rupiah } from "@/lib/format";
import { useToast } from "@/components/Toast";
import {
  AdminButton,
  AdminCard,
  EmptyState,
  Pill,
  type PillTone,
} from "@/components/admin/ui";

/* ================= Types ================= */

type HppProduct = {
  id: string;
  name: string;
  sell_price: number;
  sale_price: number | null;
  status: string;
  has_variants: boolean;
  hpp_items: Array<{ id: string; name: string; amount: number; qty?: number | null }>;
  overhead_items: Array<{ id: string; name: string; amount: number; qty?: number | null }>;
  sales_fee: number;
  kantor_share: number;
  studio_share: number;
  notes: string | null;
};

type HppDraft = {
  hppItems: Array<{ id: string; name: string; amount: number; qty?: number | null }>;
  overheadItems: Array<{ id: string; name: string; amount: number; qty?: number | null }>;
  salesFee: number;
  kantorShare: number;
  studioShare: number;
  notes: string;
};

/* ================= Constants ================= */

const DEFAULT_SALES_FEE = 10_000;
const DEFAULT_KANTOR = 40;
const DEFAULT_STUDIO = 60;

const STATUS_TONE: Record<string, PillTone> = {
  active: "green",
  draft: "amber",
  inactive: "red",
  archived: "neutral",
};

// Daftar biaya overhead bawaan — semua boleh dicek, dihapus, atau ditambah
// dengan biaya custom lewat tombol "Tambah Biaya".
const DEFAULT_OVERHEADS = [
  { name: "Listrik Studio", amount: 15_000 },
  { name: "Sewa Studio / Workspace", amount: 1_000_000 },
  { name: "Internet / Wifi", amount: 300_000 },
  { name: "Bahan Cetak (label, kartu, tissue)", amount: 25_000 },
  { name: "Packing Box / Bubble Wrap / Selotip", amount: 35_000 },
  { name: "Ongkir Barang Masuk Studio", amount: 50_000 },
  { name: "Deposite / Retainer Staff", amount: 500_000 },
];

const PRESET_COST_CATEGORIES = [
  "Harga Pokok (harga supplier)",
  "Bahan / Aset",
  "Sablon / Printing / Embroidery",
  "Cutting & Jahit",
  "QC & Finishing",
  "Sewa Mesin / Peralatan",
  "Lainnya",
];

function newId(prefix = "i") {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function emptyDraft(): HppDraft {
  return {
    hppItems: [],
    overheadItems: [],
    salesFee: DEFAULT_SALES_FEE,
    kantorShare: DEFAULT_KANTOR,
    studioShare: DEFAULT_STUDIO,
    notes: "",
  };
}

function draftFromProduct(p: HppProduct): HppDraft {
  return {
    hppItems: (p.hpp_items ?? []).map((i) => ({ ...i })),
    overheadItems: (p.overhead_items ?? []).map((i) => ({ ...i })),
    salesFee: p.sales_fee ?? DEFAULT_SALES_FEE,
    kantorShare: p.kantor_share ?? DEFAULT_KANTOR,
    studioShare: p.studio_share ?? DEFAULT_STUDIO,
    notes: p.notes ?? "",
  };
}

function sumAmounts(items: Array<{ amount: number; qty?: number | null }>): number {
  return items.reduce((s, i) => s + (Number(i.amount) || 0) * (i.qty ?? 1), 0);
}

/* ================= Component ================= */

export default function HppCalculatorClient({
  adminName,
  adminEmail,
}: {
  adminName: string | null;
  adminEmail: string | null;
}) {
  const toast = useToast();

  const [products, setProducts] = useState<HppProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<HppDraft>(emptyDraft());
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Editor biaya HPP
  const [costName, setCostName] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [costQty, setCostQty] = useState("");

  // Editor biaya custom
  const [customName, setCustomName] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [customQty, setCustomQty] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "500" });
      if (debouncedQ) params.set("q", debouncedQ);
      const res = await fetch(`/api/admin/hpp?${params}`);
      if (res.status === 401 || res.status === 403) {
        window.location.href = "/admin/login";
        return;
      }
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch {
      toast.show("Gagal memuat produk", "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, toast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Draft terisi otomatis saat pilih produk
  useEffect(() => {
    const p = products.find((x) => x.id === selectedId);
    setDraft(p ? draftFromProduct(p) : emptyDraft());
    setDirty(false);
    setSavedAt(null);
  }, [selectedId, products]);

  const selected = useMemo(
    () => products.find((x) => x.id === selectedId) ?? null,
    [products, selectedId]
  );

  /* ---- Computed values ---- */

  const hppTotal = useMemo(
    () => sumAmounts(draft.hppItems ?? []),
    [draft.hppItems]
  );
  const overheadTotal = useMemo(
    () => sumAmounts(draft.overheadItems ?? []),
    [draft.overheadItems]
  );
  const hppGrandTotal = hppTotal + overheadTotal;

  const sellPrice = selected?.sell_price ?? 0;
  const salesFee = Number(draft.salesFee) || 0;
  const kantorShare = Number(draft.kantorShare) || 0;
  const studioShare = Number(draft.studioShare) || 0;
  const shareValid = kantorShare >= 0 && studioShare >= 0 && kantorShare + studioShare === 100;

  const profit = sellPrice - hppGrandTotal - salesFee;
  const kantorAmount = shareValid ? Math.floor((profit * kantorShare) / 100) : 0;
  const studioAmount = shareValid ? profit - kantorAmount : 0;
  const hppPerItem = hppGrandTotal; // per 1 pcs produk
  const markup = hppGrandTotal > 0 ? (profit / hppGrandTotal) * 100 : null;

  /* ---- Draft mutation helpers ---- */

  const patch = (fn: (d: HppDraft) => HppDraft) => {
    setDraft((d) => fn(d));
    setDirty(true);
  };

  const addHppItem = () => {
    const name = costName.trim();
    const amount = Math.max(0, Math.round(Number(costAmount) || 0));
    if (!name && amount === 0) return;
    const qtyRaw = Number(costQty);
    const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.round(qtyRaw) : null;
    patch((d) => ({
      ...d,
      hppItems: [
        ...d.hppItems,
        ...(name || amount > 0
          ? [{ id: newId(), name: name || "(biaya)", amount, ...(qty != null ? { qty } : {}) }]
          : []),
      ],
    }));
    setCostName("");
    setCostAmount("");
    setCostQty("");
  };

  const addCustomItem = () => {
    const name = customName.trim();
    const amount = Math.max(0, Math.round(Number(customAmount) || 0));
    const qtyRaw = Number(customQty);
    const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.round(qtyRaw) : null;
    if (!name && amount === 0) return;
    patch((d) => ({
      ...d,
      overheadItems: [
        ...d.overheadItems,
        ...(name || amount > 0
          ? [{ id: newId(), name: name || "(overhead)", amount, ...(qty != null ? { qty } : {}) }]
          : []),
      ],
    }));
    setCustomName("");
    setCustomAmount("");
    setCustomQty("");
  };

  const removeHppItem = (id: string) =>
    patch((d) => ({ ...d, hppItems: d.hppItems.filter((i) => i.id !== id) }));
  const removeOverheadItem = (id: string) =>
    patch((d) => ({ ...d, overheadItems: d.overheadItems.filter((i) => i.id !== id) }));

  const togglePresetOverhead = (preset: { name: string; amount: number }) => {
    patch((d) => {
      const exists = d.overheadItems.find((i) => i.name === preset.name);
      if (exists) {
        return {
          ...d,
          overheadItems: d.overheadItems.filter((i) => i.name !== preset.name),
        };
      }
      const amountStr = preset.amount === 0 ? "" : String(preset.amount);
      return {
        ...d,
        overheadItems: [
          ...d.overheadItems,
          { id: newId(), name: preset.name, amount: preset.amount },
        ],
      };
    });
  };

  /* ---- Save ---- */

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/hpp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product_id: selected.id,
          hpp_items: draft.hppItems,
          overhead_items: draft.overheadItems,
          sales_fee: Number(draft.salesFee) || 0,
          kantor_share: Number(draft.kantorShare) || 0,
          studio_share: Number(draft.studioShare) || 0,
          notes: draft.notes || null,
        }),
      });
      if (res.status === 401 || res.status === 403) {
        window.location.href = "/admin/login";
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        toast.show(data.error || "Gagal menyimpan", "error");
        return;
      }
      setDirty(false);
      setSavedAt(new Date().toLocaleTimeString("id-ID"));
      toast.show("Data HPP tersimpan", "success");
      // Refresh list supaya kolom data yang baru simpan ter-update
      await loadProducts();
    } catch {
      toast.show("Gagal menyimpan data HPP", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ================= Render ================= */

  const activeOverheadNames = new Set(
    (draft.overheadItems ?? []).map((i) => i.name)
  );

  return (
    <AdminShell
      title="Kalkulator HPP"
      subtitle="Hitung HPP, biaya overhead, dan bagi hasil kantor / studio per produk"
      adminName={adminName}
      adminEmail={adminEmail}
    >
      <div className="grid gap-4 lg:grid-cols-[380px_1fr] lg:items-start lg:gap-5">
        {/* ============ LEFT: product list ============ */}
        <AdminCard padded={false} className="lg:sticky lg:top-20">
          <div className="border-b border-[var(--ad-border-soft)] p-3.5">
            <h2 className="flex items-center gap-2 text-[13.5px] font-bold text-[var(--ad-text)]">
              <Package size={15} strokeWidth={2.2} className="text-[var(--ad-accent)]" />
              Pilih Produk
            </h2>
            <div className="relative mt-2.5">
              <Search
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ad-text-3)]"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari produk…"
                className="ad-input w-full !pl-8"
              />
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto lg:max-h-[calc(100vh-320px)]">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-[var(--ad-text-3)]">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs">Memuat produk…</span>
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                icon={<Package size={20} />}
                title="Tidak ada produk"
                description={
                  debouncedQ
                    ? `Tidak ada produk yang cocok dengan "${debouncedQ}".`
                    : "Belum ada produk di database."
                }
              />
            ) : (
              <ul className="divide-y divide-[var(--ad-border-soft)]">
                {products.map((p) => {
                  const isSel = p.id === selectedId;
                  const hppCount =
                    (p.hpp_items?.length ?? 0) + (p.overhead_items?.length ?? 0);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(p.id)}
                        className={`flex w-full items-start gap-2.5 px-3.5 py-3 text-left transition ${
                          isSel
                            ? "bg-[var(--ad-accent-soft)]"
                            : "hover:bg-[var(--ad-surface-2)]"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            isSel
                              ? "border-[var(--ad-accent)] bg-[var(--ad-accent)]"
                              : "border-[var(--ad-border)] bg-white"
                          }`}
                        >
                          {isSel && (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-[13px] font-semibold ${
                              isSel ? "text-[var(--ad-accent)]" : "text-[var(--ad-text)]"
                            }`}
                          >
                            {p.name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Pill tone={STATUS_TONE[p.status] ?? "neutral"}>
                              {p.status}
                            </Pill>
                            <span className="text-[11px] font-bold text-[var(--ad-text-2)]">
                              {rupiah(p.sell_price ?? 0)}
                            </span>
                            {hppCount > 0 && (
                              <span className="text-[10px] font-semibold text-[var(--ad-accent)]">
                                {hppCount} biaya
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </AdminCard>

        {/* ============ RIGHT: calculator ============ */}
        <div className="space-y-4">
          {!selected ? (
            <AdminCard>
              <EmptyState
                icon={<Calculator size={22} />}
                title="Pilih produk dulu"
                description="Klik salah satu produk di kiri untuk mulai menghitung HPP, overhead, dan bagi hasilnya."
              />
            </AdminCard>
          ) : (
            <>
              {/* Product header */}
              <AdminCard>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-bold tracking-tight text-[var(--ad-text)]">
                      {selected.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-[var(--ad-text-3)]">
                      Data harga & nama diambil langsung dari database produk.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone={STATUS_TONE[selected.status] ?? "neutral"}>
                      {selected.status}
                    </Pill>
                    {selected.has_variants && (
                      <Pill tone="blue">Varian</Pill>
                    )}
                  </div>
                </div>
                <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  <div className="ad-inset p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--ad-text-3)]">
                      Harga Jual
                    </p>
                    <p className="mt-0.5 text-[17px] font-bold tracking-tight text-[var(--ad-text)]">
                      {rupiah(selected.sell_price ?? 0)}
                    </p>
                    <p className="text-[10.5px] text-[var(--ad-text-3)]">
                      {selected.sale_price != null
                        ? "Promo aktif"
                        : "Harga reguler"}
                    </p>
                  </div>
                  <div className="ad-inset p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--ad-text-3)]">
                      Total Biaya (HPP)
                    </p>
                    <p className="mt-0.5 text-[17px] font-bold tracking-tight text-[var(--ad-amber)]">
                      {rupiah(hppGrandTotal)}
                    </p>
                    <p className="text-[10.5px] text-[var(--ad-text-3)]">
                      {sumAmounts(draft.hppItems)} HPP + {overheadTotal} overhead
                    </p>
                  </div>
                  <div className="ad-inset p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--ad-text-3)]">
                      Laba Bersih
                    </p>
                    <p
                      className={`mt-0.5 text-[17px] font-bold tracking-tight ${
                        profit >= 0 ? "text-[var(--ad-green)]" : "text-[var(--ad-red)]"
                      }`}
                    >
                      {rupiah(Math.max(profit, 0))}
                    </p>
                    <p className="text-[10.5px] text-[var(--ad-text-3)]">
                      {markup != null
                        ? `Margin ${markup.toFixed(1)}% dari biaya`
                        : "Setelah dikurangi biaya & sales"}
                    </p>
                  </div>
                </div>
              </AdminCard>

              {/* ---- Step 1: HPP costs ---- */}
              <AdminCard>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ad-amber-soft,#fff7ed)] text-[var(--ad-amber)]">
                    <Banknote size={15} strokeWidth={2.2} />
                  </span>
                  <div>
                    <h3 className="text-[13.5px] font-bold text-[var(--ad-text)]">
                      1 · Biaya HPP Produk
                    </h3>
                    <p className="text-[11px] text-[var(--ad-text-3)]">
                      Biaya-biaya langsung per produk (bahan, sablon, jahit, dsb.)
                    </p>
                  </div>
                </div>

                {/* Add cost row */}
                <div className="mt-3.5 grid grid-cols-[1fr_100px_70px_36px] gap-2">
                  <div>
                    <input
                      list="preset-cost-categories"
                      value={costName}
                      onChange={(e) => setCostName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addHppItem();
                      }}
                      placeholder="Nama biaya (coba ketik untuk saran)"
                      className="ad-input w-full"
                    />
                    <datalist id="preset-cost-categories">
                      {PRESET_COST_CATEGORIES.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={costAmount}
                    onChange={(e) => setCostAmount(e.target.value)}
                    placeholder="Harga (Rp)"
                    className="ad-input"
                  />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={costQty}
                    onChange={(e) => setCostQty(e.target.value)}
                    placeholder="Qty"
                    className="ad-input"
                  />
                  <button
                    type="button"
                    onClick={addHppItem}
                    title="Tambah biaya"
                    className="flex h-[38px] w-[36px] items-center justify-center rounded-lg bg-[var(--ad-amber)] text-white shadow-sm transition hover:opacity-90"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Cost rows */}
                {draft.hppItems.length > 0 ? (
                  <ul className="mt-3 divide-y divide-[var(--ad-border-soft)] rounded-lg border border-[var(--ad-border-soft)]">
                    {draft.hppItems.map((item) => (
                      <li key={item.id} className="flex items-center gap-2.5 px-3 py-2.5">
                        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-[var(--ad-text)]">
                          {item.name}
                          {item.qty != null && item.qty > 1 && (
                            <span className="ml-1.5 text-[10.5px] font-bold text-[var(--ad-text-3)]">
                              × {item.qty}
                            </span>
                          )}
                        </span>
                        <span className="w-24 shrink-0 text-right text-[12.5px] font-bold tabular-nums text-[var(--ad-text)]">
                          {rupiah((item.amount || 0) * (item.qty ?? 1))}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeHppItem(item.id)}
                          className="shrink-0 rounded p-1 text-[var(--ad-text-3)] transition hover:bg-red-50 hover:text-[var(--ad-red)]"
                          aria-label="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-[12px] italic text-[var(--ad-text-3)]">
                    Belum ada biaya HPP. Tambah lewat form di atas, atau pilih dari
                    kategori saran di kolom nama.
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between rounded-lg bg-[var(--ad-amber-soft,#fff7ed)] px-3.5 py-2.5">
                  <span className="text-[12px] font-bold text-[var(--ad-amber)]">
                    Total HPP Produk
                  </span>
                  <span className="text-[14px] font-bold tabular-nums text-[var(--ad-amber)]">
                    {rupiah(hppTotal)}
                  </span>
                </div>
              </AdminCard>

              {/* ---- Step 2: overhead ---- */}
              <AdminCard>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ad-accent-soft)] text-[var(--ad-accent)]">
                    <Settings2 size={15} strokeWidth={2.2} />
                  </span>
                  <div>
                    <h3 className="text-[13.5px] font-bold text-[var(--ad-text)]">
                      2 · Biaya Overhead / Operasional
                    </h3>
                    <p className="text-[11px] text-[var(--ad-text-3)]">
                      Biaya tetap studio. Centang yang terpakai, ubah nominalnya,
                      atau tambah yang belum ada.
                    </p>
                  </div>
                </div>

                {/* Preset checkboxes */}
                <div className="mt-3.5 grid gap-1.5 sm:grid-cols-2">
                  {DEFAULT_OVERHEADS.map((preset) => {
                    const active = activeOverheadNames.has(preset.name);
                    const item = (draft.overheadItems ?? []).find(
                      (i) => i.name === preset.name
                    );
                    return (
                      <div
                        key={preset.name}
                        className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 transition ${
                          active
                            ? "border-[var(--ad-accent)] bg-[var(--ad-accent-soft)]"
                            : "border-[var(--ad-border-soft)] bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={`oh-${preset.name}`}
                          checked={active}
                          onChange={() => togglePresetOverhead(preset)}
                          className="h-3.5 w-3.5 shrink-0 accent-[var(--ad-accent)]"
                        />
                        <label
                          htmlFor={`oh-${preset.name}`}
                          className={`min-w-0 flex-1 cursor-pointer truncate text-[12px] font-medium ${
                            active ? "text-[var(--ad-accent)]" : "text-[var(--ad-text-2)]"
                          }`}
                        >
                          {preset.name}
                        </label>
                        {active && item && (
                          <input
                            type="number"
                            min="0"
                            step="5000"
                            value={String(item.amount || 0)}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              patch((d) => ({
                                ...d,
                                overheadItems: d.overheadItems.map((i) =>
                                  i.name === preset.name ? { ...i, amount: val } : i
                                ),
                              }));
                            }}
                            className="ad-input w-[88px] !py-1 !text-[11.5px] tabular-nums"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Custom overhead */}
                <div className="mt-3.5 rounded-lg border border-dashed border-[var(--ad-border)] p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--ad-text-3)]">
                    <Plus size={12} />
                    Tambah Biaya Sendiri
                  </p>
                  <div className="grid grid-cols-[1fr_100px_70px_36px] gap-2">
                    <input
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Contoh: Gas kompresor"
                      className="ad-input"
                    />
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Rp"
                      className="ad-input"
                    />
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={customQty}
                      onChange={(e) => setCustomQty(e.target.value)}
                      placeholder="Qty"
                      className="ad-input"
                    />
                    <button
                      type="button"
                      onClick={addCustomItem}
                      className="flex h-[38px] w-[36px] items-center justify-center rounded-lg bg-[var(--ad-accent)] text-white shadow-sm transition hover:opacity-90"
                      title="Tambah overhead"
                    >
                      <Plus size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Custom / extra overhead items */}
                {(draft.overheadItems ?? [])
                  .filter((i) => !DEFAULT_OVERHEADS.some((p) => p.name === i.name))
                  .length > 0 && (
                    <ul className="mt-3 divide-y divide-[var(--ad-border-soft)] rounded-lg border border-[var(--ad-border-soft)]">
                      {(draft.overheadItems ?? [])
                        .filter((i) => !DEFAULT_OVERHEADS.some((p) => p.name === i.name))
                        .map((item) => (
                          <li key={item.id} className="flex items-center gap-2.5 px-3 py-2">
                            <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-[var(--ad-text)]">
                              {item.name}
                              {item.qty != null && item.qty > 1 && (
                                <span className="ml-1.5 text-[10.5px] font-bold text-[var(--ad-text-3)]">
                                  × {item.qty}
                                </span>
                              )}
                            </span>
                            <span className="w-24 shrink-0 text-right text-[12.5px] font-bold tabular-nums text-[var(--ad-text)]">
                              {rupiah(item.amount * (item.qty ?? 1))}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeOverheadItem(item.id)}
                              className="shrink-0 rounded p-1 text-[var(--ad-text-3)] transition hover:bg-red-50 hover:text-[var(--ad-red)]"
                              aria-label="Hapus"
                            >
                              <Trash2 size={13} />
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}

                <div className="mt-3 flex items-center justify-between rounded-lg bg-[var(--ad-accent-soft)] px-3.5 py-2.5">
                  <span className="text-[12px] font-bold text-[var(--ad-accent)]">
                    Total Overhead
                  </span>
                  <span className="text-[14px] font-bold tabular-nums text-[var(--ad-accent)]">
                    {rupiah(overheadTotal)}
                  </span>
                </div>
              </AdminCard>

              {/* ---- Step 3: profit split ---- */}
              <AdminCard>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ad-green-soft,#dcfce7)] text-[var(--ad-green)]">
                    <Palette size={15} strokeWidth={2.2} />
                  </span>
                  <div>
                    <h3 className="text-[13.5px] font-bold text-[var(--ad-text)]">
                      3 · Bagi Hasil Keuntungan
                    </h3>
                    <p className="text-[11px] text-[var(--ad-text-3)]">
                      Potongan sales, lalu sisa keuntungan dibagi kantor / studio
                    </p>
                  </div>
                </div>

                {/* Inputs */}
                <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <div>
                    <label className="ad-label">
                      <span>
                        Potongan Sales <span className="text-[var(--ad-text-3)]">(Rp)</span>
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={String(draft.salesFee ?? 0)}
                      onChange={(e) =>
                        patch((d) => ({ ...d, salesFee: Math.max(0, Number(e.target.value) || 0) }))
                      }
                      className="ad-input"
                    />
                  </div>
                  <div>
                    <label className="ad-label">
                      <span>
                        Kantor <span className="text-[var(--ad-text-3)]">(% )</span>
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={String(draft.kantorShare ?? 0)}
                      onChange={(e) =>
                        patch((d) => ({
                          ...d,
                          kantorShare: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                        }))
                      }
                      className="ad-input"
                    />
                  </div>
                  <div>
                    <label className="ad-label">
                      <span>
                        Studio <span className="text-[var(--ad-text-3)]">(% )</span>
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={String(draft.studioShare ?? 0)}
                      onChange={(e) =>
                        patch((d) => ({
                          ...d,
                          studioShare: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                        }))
                      }
                      className="ad-input"
                    />
                  </div>
                </div>
                {!shareValid && (
                  <p className="mt-2 text-[11.5px] font-semibold text-[var(--ad-red)]">
                    Porsi kantor + studio harus total 100%. Skarang:{" "}
                    {kantorShare + studioShare}%.
                  </p>
                )}

                {/* Breakdown */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between rounded-lg bg-[var(--ad-surface-2)] px-3.5 py-2.5">
                    <span className="text-[12.5px] font-medium text-[var(--ad-text-2)]">
                      Harga jual
                    </span>
                    <span className="text-[14px] font-bold tabular-nums text-[var(--ad-text)]">
                      {rupiah(sellPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-[var(--ad-surface-2)] px-3.5 py-2.5">
                    <span className="text-[12.5px] font-medium text-[var(--ad-text-2)]">
                      − Total biaya (HPP + overhead)
                    </span>
                    <span className="text-[14px] font-bold tabular-nums text-[var(--ad-amber)]">
                      − {rupiah(hppGrandTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-[var(--ad-surface-2)] px-3.5 py-2.5">
                    <span className="text-[12.5px] font-medium text-[var(--ad-text-2)]">
                      − Potongan sales
                    </span>
                    <span className="text-[14px] font-bold tabular-nums text-[var(--ad-red)]">
                      − {rupiah(salesFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[var(--ad-border-soft)] bg-white px-3.5 py-2.5">
                    <span className="text-[12.5px] font-bold text-[var(--ad-text)]">
                      = Laba bersih
                    </span>
                    <span
                      className={`text-[15px] font-bold tabular-nums ${
                        profit >= 0 ? "text-[var(--ad-green)]" : "text-[var(--ad-red)]"
                      }`}
                    >
                      {rupiah(Math.max(profit, 0))}
                    </span>
                  </div>

                  {shareValid && profit > 0 ? (
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div className="rounded-lg border border-[var(--ad-green)]/30 bg-[var(--ad-green-soft,#dcfce7)] px-3.5 py-3">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={13} strokeWidth={2.4} className="text-[var(--ad-green)]" />
                          <span className="text-[10.5px] font-bold uppercase tracking-wide text-[var(--ad-green)]">
                            Kantor ({kantorShare}%)
                          </span>
                        </div>
                        <p className="mt-1 text-[17px] font-bold tabular-nums tracking-tight text-[var(--ad-text)]">
                          {rupiah(kantorAmount)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[var(--ad-accent)]/30 bg-[var(--ad-accent-soft)] px-3.5 py-3">
                        <div className="flex items-center gap-1.5">
                          <Palette size={13} strokeWidth={2.4} className="text-[var(--ad-accent)]" />
                          <span className="text-[10.5px] font-bold uppercase tracking-wide text-[var(--ad-accent)]">
                            Studio ({studioShare}%)
                          </span>
                        </div>
                        <p className="mt-1 text-[17px] font-bold tabular-nums tracking-tight text-[var(--ad-text)]">
                          {rupiah(studioAmount)}
                        </p>
                      </div>
                    </div>
                  ) : profit <= 0 ? (
                    <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[12px] font-semibold text-[var(--ad-red)]">
                      ⚠ Harga jual masih di bawah total biaya — produk ini rugi{" "}
                      {rupiah(Math.abs(profit))} per pcs.
                    </p>
                  ) : null}
                </div>

                {/* Notes */}
                <div className="mt-3.5">
                  <label className="ad-label">
                    <span>Catatan (opsional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={draft.notes}
                    onChange={(e) => patch((d) => ({ ...d, notes: e.target.value }))}
                    placeholder="Contoh: harga sablon naik, revisi di batch berikutnya…"
                    className="ad-input resize-none"
                  />
                </div>
              </AdminCard>

              {/* ---- Save bar ---- */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--ad-border-soft)] bg-white p-3.5 shadow-sm">
                <div className="text-[11.5px] text-[var(--ad-text-3)]">
                  {dirty ? (
                    <span className="font-semibold text-[var(--ad-amber)]">
                      • Ada perubahan belum disimpan
                    </span>
                  ) : savedAt ? (
                    <span>✓ Tersimpan pukul {savedAt}</span>
                  ) : (
                    <span>Belum ada perubahan</span>
                  )}
                </div>
                <AdminButton
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving || !dirty}
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Menyimpan…
                    </>
                  ) : (
                    <>
                      <Save size={14} strokeWidth={2.4} />
                      Simpan Data HPP
                    </>
                  )}
                </AdminButton>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
