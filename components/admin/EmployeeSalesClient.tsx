"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckSquare,
  Loader2,
  Save,
  Search,
  Tag,
  TrendingUp,
  User,
  Users,
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

type Product = {
  id: string;
  name: string;
  sell_price: number;
  sale_price: number | null;
  status: string;
  has_variants: boolean;
  hpp_per_unit: number;
  purchased: boolean;
  special_price: number | null;
  hpp_snapshot: number | null;
};

type Employee = {
  id: string;
  full_name: string;
  note: string | null;
  created_at: string;
  sales: Product[];
};

type DraftEntry = {
  productId: string;
  purchased: boolean;
  specialPrice: number | null;
  hpp: number | null; // null = pakai nilai HPP yang tersimpan di Kalkulator HPP
};

/* ================= Constants ================= */

const STATUS_TONE: Record<string, PillTone> = {
  active: "green",
  draft: "amber",
  inactive: "red",
  archived: "neutral",
};

/* ================= Helpers ================= */

function marginOf(p: Product, special: number | null): number {
  const sp = special != null && special > 0 ? special : p.sell_price;
  return sp - p.hpp_per_unit;
}

function seedFromEmployee(e: Employee): Map<string, DraftEntry> {
  const m = new Map<string, DraftEntry>();
  for (const s of e.sales ?? []) {
    m.set(s.id, {
      productId: s.id,
      purchased: s.purchased,
      specialPrice:
        s.special_price != null && s.special_price > 0 ? s.special_price : null,
      hpp: s.hpp_per_unit > 0 ? s.hpp_per_unit : null,
    });
  }
  // Produk yang belum punya row di employee_sales → default belum dibeli,
  // HPP di ambil dari snapshot (kalau ada) atau kosong
  return m;
}

/* ================= Component ================= */

export default function EmployeeSalesClient({
  adminName,
  adminEmail,
}: {
  adminName: string | null;
  adminEmail: string | null;
}) {
  const toast = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Map<string, DraftEntry>>(new Map());
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [newEmployeeName, setNewEmployeeName] = useState("");

  const selected = useMemo(
    () => employees.find((e) => e.id === selectedId) ?? null,
    [employees, selectedId]
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQ) params.set("q", debouncedQ);
      const res = await fetch(`/api/admin/employee-sales?${params}`);
      if (res.status === 401 || res.status === 403) {
        window.location.href = "/admin/login";
        return;
      }
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const list: Employee[] = data.employees ?? [];
      setEmployees(list);
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0].id);
      }
    } catch {
      toast.show("Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, selectedId, toast]);

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadEmployees]);

  // Saat karyawan dipilih, seed draft dari data tersimpan (atau kosong)
  useEffect(() => {
    if (!selected) {
      setDrafts(new Map());
      return;
    }
    setDrafts(seedFromEmployee(selected));
    setDirty(false);
    setSavedAt(null);
  }, [selectedId, selected]);

  const patch = (fn: (m: Map<string, DraftEntry>) => Map<string, DraftEntry>) => {
    setDrafts((prev) => fn(prev));
    setDirty(true);
  };

  const togglePurchased = (productId: string) => {
    patch((m) => {
      const cur = m.get(productId) ?? {
        productId,
        purchased: false,
        specialPrice: null,
        hpp: null,
      };
      return new Map(m).set(productId, { ...cur, purchased: !cur.purchased });
    });
  };

  const setSpecialPrice = (productId: string, raw: string) => {
    patch((m) => {
      const cur = m.get(productId) ?? {
        productId,
        purchased: false,
        specialPrice: null,
        hpp: null,
      };
      const val =
        raw === "" ? null : Math.max(0, Math.round(Number(raw) || 0));
      return new Map(m).set(productId, { ...cur, specialPrice: val });
    });
  };

  const setHpp = (productId: string, raw: string) => {
    patch((m) => {
      const cur = m.get(productId) ?? {
        productId,
        purchased: false,
        specialPrice: null,
        hpp: null,
      };
      const val =
        raw === "" ? null : Math.max(0, Math.round(Number(raw) || 0));
      return new Map(m).set(productId, { ...cur, hpp: val });
    });
  };

  /* ---- Buat karyawan baru (tanpa produk) ---- */
  const addEmployee = async () => {
    const name = newEmployeeName.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/admin/employee-sales", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          employee_name: name,
          employee_note: null,
          entries: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.show(data.error || "Gagal menambah karyawan", "error");
        return;
      }
      setNewEmployeeName("");
      toast.show(`Karyawan "${name}" ditambahkan`, "success");
      setSelectedId(null);
      await loadEmployees();
      // Pilih karyawan yang baru dibuat
      await new Promise((r) => setTimeout(r, 300));
      setEmployees((prev) => {
        const e = prev.find((x) => x.full_name.toLowerCase() === name.toLowerCase());
        if (e) setSelectedId(e.id);
        return prev;
      });
    } catch {
      toast.show("Gagal menambah karyawan", "error");
    }
  };

  /* ---- Simpan draft untuk karyawan terpilih ---- */
  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const entries = Array.from(drafts.values()).map((d) => ({
        product_id: d.productId,
        special_price: d.specialPrice,
        purchased: d.purchased,
      }));
      const hppOverrides = Array.from(drafts.values())
        .filter((d) => d.hpp != null)
        .map((d) => ({ product_id: d.productId, hpp: d.hpp as number }));
      const res = await fetch("/api/admin/employee-sales", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          employee_name: selected.full_name,
          employee_note: selected.note,
          entries,
          hpp_overrides: hppOverrides,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.show(data.error || "Gagal menyimpan", "error");
        return;
      }
      setDirty(false);
      setSavedAt(new Date().toLocaleTimeString("id-ID"));
      toast.show("Tersimpan", "success");
      await loadEmployees();
    } catch {
      toast.show("Gagal menyimpan data", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ================= Derived (untuk tampilan margin) ================= */

  const totalProducts = selected?.sales.length ?? 0;
  const purchasedCount = selected
    ? selected.sales.filter((p) => drafts.get(p.id)?.purchased).length
    : 0;

  const summary = useMemo(() => {
    if (!selected) return null;
    let sumMargin = 0;
    let sumSpecial = 0;
    let count = 0;
    for (const p of selected.sales ?? []) {
      const d = drafts.get(p.id);
      if (!d?.purchased) continue;
      const sp = d.specialPrice != null ? d.specialPrice : p.sell_price;
      const hpp = d.hpp != null ? d.hpp : p.hpp_per_unit;
      sumSpecial += sp;
      sumMargin += sp - hpp;
      count++;
    }
    const avgMargin = count > 0 ? Math.round(sumMargin / count) : 0;
    return { avgMargin, totalMargin: sumMargin, purchased: count, totalSpecial: sumSpecial };
  }, [selected, drafts]);

  /* ================= Render ================= */

  return (
    <AdminShell
      title="Penjualan Karyawan"
      subtitle="Harga khusus per karyawan — max 1 per produk"
      adminName={adminName}
      adminEmail={adminEmail}
    >
      <div className="grid gap-4 lg:grid-cols-[340px_1fr] lg:items-start lg:gap-5">
        {/* ============ LEFT: employees ============ */}
        <AdminCard padded={false} className="lg:sticky lg:top-20">
          <div className="border-b border-[var(--ad-border-soft)] p-3.5">
            <h2 className="flex items-center gap-2 text-[13.5px] font-bold text-[var(--ad-text)]">
              <Users size={15} strokeWidth={2.2} className="text-[var(--ad-accent)]" />
              Karyawan
            </h2>

            {/* Add new */}
            <div className="mt-2.5 flex gap-2">
              <input
                value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEmployee()}
                placeholder="Nama karyawan baru…"
                className="ad-input min-w-0 flex-1"
              />
              <button
                type="button"
                onClick={addEmployee}
                title="Tambah karyawan"
                className="ad-btn ad-btn-primary ad-btn-icon !h-[38px] !w-[38px] shrink-0"
              >
                <User size={15} strokeWidth={2.4} />
              </button>
            </div>

            {/* Search */}
            <div className="relative mt-2.5">
              <Search
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ad-text-3)]"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari karyawan…"
                className="ad-input w-full !pl-8"
              />
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto lg:max-h-[calc(100vh-360px)]">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-[var(--ad-text-3)]">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs">Memuat…</span>
              </div>
            ) : employees.length === 0 ? (
              <EmptyState
                icon={<Users size={20} />}
                title="Belum ada karyawan"
                description="Input nama di atas untuk menambah karyawan pertama."
              />
            ) : (
              <ul className="divide-y divide-[var(--ad-border-soft)]">
                {employees.map((e) => {
                  const isSel = e.id === selectedId;
                  const bought = (e.sales ?? []).filter((p) => p.purchased).length;
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(e.id)}
                        className={`flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition ${
                          isSel
                            ? "bg-[var(--ad-accent-soft)]"
                            : "hover:bg-[var(--ad-surface-2)]"
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                            isSel
                              ? "bg-[var(--ad-accent)] text-white"
                              : "bg-[var(--ad-surface-2)] text-[var(--ad-text-2)]"
                          }`}
                        >
                          {e.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-[13px] font-semibold ${
                              isSel ? "text-[var(--ad-accent)]" : "text-[var(--ad-text)]"
                            }`}
                          >
                            {e.full_name}
                          </p>
                          <p className="text-[10.5px] text-[var(--ad-text-3)]">
                            {bought} produk terbeli
                          </p>
                        </div>
                        {bought > 0 && (
                          <Pill tone="green">{bought}</Pill>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </AdminCard>

        {/* ============ RIGHT: per-product ============ */}
        <div className="space-y-4">
          {!selected ? (
            <AdminCard>
              <EmptyState
                icon={<CheckSquare size={22} />}
                title="Pilih karyawan dulu"
                description="Klik salah satu karyawan di kiri untuk set harga khusus & ceklis produk."
              />
            </AdminCard>
          ) : (
            <>
              {/* Header + summary */}
              <AdminCard>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-bold tracking-tight text-[var(--ad-text)]">
                      {selected.full_name}
                    </h2>
                    <p className="mt-0.5 text-xs text-[var(--ad-text-3)]">
                      {purchasedCount} / {totalProducts} produk terbeli
                    </p>
                  </div>
                  {summary && summary.purchased > 0 && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="ad-inset p-2.5">
                        <p className="text-[9.5px] font-bold uppercase tracking-wide text-[var(--ad-text-3)]">
                          Rata-rata Margin
                        </p>
                        <p
                          className={`mt-0.5 text-[15px] font-bold tabular-nums ${
                            summary.avgMargin >= 0
                              ? "text-[var(--ad-green)]"
                              : "text-[var(--ad-red)]"
                          }`}
                        >
                          {rupiah(summary.avgMargin)}
                        </p>
                      </div>
                      <div className="ad-inset p-2.5">
                        <p className="text-[9.5px] font-bold uppercase tracking-wide text-[var(--ad-text-3)]">
                          Total Margin
                        </p>
                        <p
                          className={`mt-0.5 text-[15px] font-bold tabular-nums ${
                            summary.totalMargin >= 0
                              ? "text-[var(--ad-green)]"
                              : "text-[var(--ad-red)]"
                          }`}
                        >
                          {rupiah(summary.totalMargin)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </AdminCard>

              {/* Products table */}
              <AdminCard padded={false}>
                <div className="overflow-x-auto">
                  <table className="ad-table w-full min-w-[680px]">
                    <thead>
                      <tr className="bg-[var(--ad-surface-2)]">
                        <th className="w-12">✓</th>
                        <th>Produk</th>
                        <th className="text-right">Harga Jual</th>
                        <th className="text-right">HPP</th>
                        <th className="text-right">Harga Khusus</th>
                        <th className="text-right">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selected.sales ?? []).map((p) => {
                        const d = drafts.get(p.id) ?? {
                          productId: p.id,
                          purchased: false,
                          specialPrice: null,
                          hpp: null,
                        };
                        const sp = d.specialPrice ?? p.sell_price;
                        const hppNow = d.hpp != null ? d.hpp : p.hpp_per_unit;
                        const margin = sp - hppNow;
                        return (
                          <tr
                            key={p.id}
                            className={
                              d.purchased
                                ? "bg-[var(--ad-green-soft,#f0fdf4)]"
                                : ""
                            }
                          >
                            <td className="text-center">
                              <input
                                type="checkbox"
                                checked={d.purchased}
                                onChange={() => togglePurchased(p.id)}
                                className="h-4 w-4 accent-[var(--ad-green)]"
                                title={
                                  d.purchased
                                    ? "Sudah beli — klik untuk batalkan"
                                    : "Belum beli — klik untuk tandai terbeli"
                                }
                              />
                            </td>
                            <td>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[13px] font-semibold text-[var(--ad-text)]">
                                  {p.name}
                                </span>
                                <Pill tone={STATUS_TONE[p.status] ?? "neutral"}>
                                  {p.status}
                                </Pill>
                                {p.has_variants && <Pill tone="blue">Varian</Pill>}
                              </div>
                            </td>
                            <td className="text-right text-[12.5px] tabular-nums text-[var(--ad-text)]">
                              {p.sale_price != null && (
                                <span className="mr-1.5 text-[10.5px] line-through text-[var(--ad-text-3)]">
                                  {rupiah(p.sale_price)}
                                </span>
                              )}
                              {rupiah(p.sell_price)}
                            </td>
                            <td className="text-right">
                              <input
                                type="number"
                                min="0"
                                step="5000"
                                value={d.hpp != null ? String(d.hpp) : ""}
                                onChange={(e) => setHpp(p.id, e.target.value)}
                                placeholder={p.hpp_per_unit > 0 ? String(p.hpp_per_unit) : "0"}
                                title="Kosongkan = pakai HPP tersimpan di Kalkulator HPP"
                                className="ad-input ml-auto w-[110px] !py-1.5 !text-[12px] tabular-nums"
                              />
                            </td>
                            <td className="text-right">
                              <input
                                type="number"
                                min="0"
                                step="5000"
                                value={d.specialPrice != null ? String(d.specialPrice) : ""}
                                onChange={(e) => setSpecialPrice(p.id, e.target.value)}
                                placeholder={rupiah(p.sell_price)}
                                title="Kosongkan = pakai harga jual reguler"
                                className="ad-input ml-auto w-[120px] !py-1.5 !text-[12px] tabular-nums"
                              />
                            </td>
                            <td
                              className={`text-right text-[13px] font-bold tabular-nums ${
                                margin >= 0 ? "text-[var(--ad-green)]" : "text-[var(--ad-red)]"
                              }`}
                            >
                              {rupiah(margin)}
                              <span className="ml-1 text-[10px] font-medium text-[var(--ad-text-3)]">
                                ({sp > 0 ? ((margin / sp) * 100).toFixed(1) : "0"}%)
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </AdminCard>

              {/* Save bar */}
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
                      Simpan
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
