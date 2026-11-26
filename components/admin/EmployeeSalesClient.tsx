"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckSquare,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
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
  hpp_effective: number;
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
  hppTyped: number | null;
  hppTouched: boolean;
};

/* ================= Helpers ================= */

// HPP yang dipakai untuk tampilan/margin.
// - Touched + terisi  → ketikan admin
// - Touched + kosong  → kembali ke HPP Kalkulator (p.hpp_per_unit)
// - Tidak touched     → HPP tercatat (snapshot) kalau ada, selain itu Kalkulator
function hppForDisplay(p: Product, d: DraftEntry | undefined): number {
  if (d && d.hppTouched) {
    if (d.hppTyped != null) return d.hppTyped;
    return p.hpp_per_unit ?? 0;
  }
  return p.hpp_effective ?? 0;
}

// Label kecil di bawah kolom HPP
function hppLabel(p: Product, d: DraftEntry | undefined): string {
  if (d && d.hppTouched) {
    return d.hppTyped != null ? "custom" : "Kalkulator";
  }
  if (p.hpp_snapshot != null) return "tercatat";
  return "";
}

function seedFromEmployee(e: Employee): Map<string, DraftEntry> {
  const m = new Map<string, DraftEntry>();
  for (const s of e.sales ?? []) {
    m.set(s.id, {
      productId: s.id,
      purchased: s.purchased,
      specialPrice:
        s.special_price != null && s.special_price > 0 ? s.special_price : null,
      hppTyped: null,
      hppTouched: false,
    });
  }
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
  const [newEmployeeOpen, setNewEmployeeOpen] = useState(false);

  const selected = useMemo(
    () => employees.find((e) => e.id === selectedId) ?? null,
    [employees, selectedId]
  );

  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;
  const prevEmployeeIdRef = useRef<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const fetchEmployeesRaw = useCallback(
    async (filterName?: string): Promise<Employee[] | null> => {
      const params = new URLSearchParams();
      if (filterName) params.set("q", filterName);
      const res = await fetch(`/api/admin/employee-sales?${params}`);
      if (res.status === 401 || res.status === 403) {
        window.location.href = "/admin/login";
        return null;
      }
      if (!res.ok) return null;
      const data = await res.json();
      return (data.employees ?? []) as Employee[];
    },
    []
  );

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchEmployeesRaw(debouncedQ || undefined);
      if (list) {
        setEmployees(list);
        if (list.length > 0 && !selectedId) {
          setSelectedId(list[0].id);
        }
      }
    } catch {
      toast.show("Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  }, [fetchEmployeesRaw, debouncedQ, selectedId, toast]);

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadEmployees]);

  // Seed draft hanya saat ID karyawan berubah; konfirmasi udah di selectEmployee.
  useEffect(() => {
    if (!selected) {
      setDrafts(new Map());
      setDirty(false);
      prevEmployeeIdRef.current = null;
      return;
    }
    setDrafts(seedFromEmployee(selected));
    setDirty(false);
    setSavedAt(null);
    prevEmployeeIdRef.current = selected.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const draftsBelongsToSelected =
    prevEmployeeIdRef.current === selected?.id;

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
        hppTyped: null,
        hppTouched: false,
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
        hppTyped: null,
        hppTouched: false,
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
        hppTyped: null,
        hppTouched: false,
      };
      const val =
        raw === "" ? null : Math.max(0, Math.round(Number(raw) || 0));
      return new Map(m).set(productId, {
        ...cur,
        hppTyped: val,
        hppTouched: true,
      });
    });
  };

  const selectEmployee = (id: string | null) => {
    if (id === selectedId) return;
    if (dirtyRef.current) {
      const ok = window.confirm(
        "Ada perubahan yang belum disimpan. Lanjut ganti karyawan? Perubahan akan hilang."
      );
      if (!ok) return;
      setDirty(false);
      setSavedAt(null);
    }
    setSelectedId(id);
  };

  const addEmployee = async () => {
    const name = newEmployeeName.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/admin/employee-sales", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ employee_name: name, entries: [] }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.show(data.error || "Gagal menambah karyawan", "error");
        return;
      }
      setNewEmployeeName("");
      setNewEmployeeOpen(false);
      const createdId: string | undefined = data.employee?.id ?? undefined;
      const wasNew: boolean = data.created === true;
      // Bedakan pesan: benar-benar baru dibuat vs. nama sudah ada
      toast.show(
        wasNew
          ? `Karyawan "${name}" ditambahkan`
          : `Karyawan "${name}" sudah ada — draft dibuka`,
        "success"
      );
      // Reset filter cari (agar jumlah di header benar), muat ulang full list,
      // pilih karyawan via id pasti dari respons POST (bukan hasil filter ilike).
      setQ("");
      setDebouncedQ("");
      const list = await fetchEmployeesRaw();
      if (list) {
        setEmployees(list);
        if (createdId) selectEmployee(createdId);
      }
    } catch {
      toast.show("Gagal menambah karyawan", "error");
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    if (prevEmployeeIdRef.current !== selected.id) {
      toast.show("Draft belum sinkron dengan karyawan terpilih", "error");
      return;
    }
    setSaving(true);
    try {
      const entries = Array.from(drafts.values()).map((d) => ({
        product_id: d.productId,
        special_price: d.specialPrice,
        purchased: d.purchased,
      }));
      const hppValues = Array.from(drafts.values())
        .filter((d) => d.hppTouched)
        .map((d) => ({ product_id: d.productId, hpp: d.hppTyped }));
      const res = await fetch("/api/admin/employee-sales", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          employee_name: selected.full_name,
          employee_note: selected.note,
          entries,
          hpp_values: hppValues,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.show(data.error || "Gagal menyimpan", "error");
        return;
      }
      setDirty(false);
      toast.show("Tersimpan", "success");
      await loadEmployees();
      const fresh = await fetchEmployeesRaw();
      const updated = fresh?.find((x) => x.id === selected.id);
      if (updated) setDrafts(seedFromEmployee(updated));
      setSavedAt(new Date().toLocaleTimeString("id-ID"));
    } catch {
      toast.show("Gagal menyimpan data", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ================= Derived ================= */

  const summary = useMemo(() => {
    if (!selected) return null;
    let totalMargin = 0;
    let totalSpecial = 0;
    let count = 0;
    for (const p of selected.sales ?? []) {
      const d = drafts.get(p.id);
      if (!d?.purchased) continue;
      const sp = d.specialPrice != null ? d.specialPrice : p.sell_price;
      const hpp = hppForDisplay(p, d);
      totalSpecial += sp;
      totalMargin += sp - hpp;
      count++;
    }
    const avgMargin = count > 0 ? Math.round(totalMargin / count) : 0;
    return { avgMargin, totalMargin, purchased: count, totalSpecial };
  }, [selected, drafts]);

  /* ================= Render ================= */

  return (
    <AdminShell
      title="Penjualan Karyawan"
      subtitle="Harga khusus per karyawan · 1 per produk"
      adminName={adminName}
      adminEmail={adminEmail}
    >
      {/* ============ Top bar: search + add ============ */}
      <AdminCard className="!p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ad-text-3)]"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari karyawan…"
              className="ad-input w-full !pl-9"
            />
          </div>

          <button
            type="button"
            onClick={() => setNewEmployeeOpen((v) => !v)}
            className={`ad-btn ad-btn-icon ${
              newEmployeeOpen ? "ad-btn-primary" : "ad-btn-secondary"
            } !h-9 !w-9 shrink-0`}
            title="Tambah karyawan"
          >
            {newEmployeeOpen ? (
              <Trash2 size={15} strokeWidth={2.2} />
            ) : (
              <Plus size={16} strokeWidth={2.4} />
            )}
          </button>

          <span className="ml-auto text-[11.5px] text-[var(--ad-text-3)]">
            {employees.length} karyawan
          </span>
        </div>

        {newEmployeeOpen && (
          <div className="mt-3 flex gap-2 border-t border-[var(--ad-border-soft)] pt-3">
            <input
              autoFocus
              value={newEmployeeName}
              onChange={(e) => setNewEmployeeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addEmployee();
                if (e.key === "Escape") setNewEmployeeOpen(false);
              }}
              placeholder="Nama karyawan baru…"
              className="ad-input min-w-0 flex-1"
            />
            <AdminButton
              variant="primary"
              onClick={addEmployee}
              disabled={!newEmployeeName.trim()}
            >
              <User size={14} strokeWidth={2.4} />
              Tambah
            </AdminButton>
          </div>
        )}
      </AdminCard>

      {/* ============ Employee chips ============ */}
      <div className="flex items-start gap-4 lg:gap-5">
        <AdminCard padded={false} className="shrink-0 lg:sticky lg:top-20 lg:w-[260px]">
          <div className="flex items-center gap-2 border-b border-[var(--ad-border-soft)] px-3.5 py-3">
            <Users size={14} strokeWidth={2.4} className="text-[var(--ad-accent)]" />
            <span className="text-[12.5px] font-bold text-[var(--ad-text)]">
              Karyawan
            </span>
            <span className="ml-auto text-[10.5px] text-[var(--ad-text-3)]">
              {employees.length}
            </span>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-[var(--ad-text-3)]">
                <Loader2 size={15} className="animate-spin" />
                <span className="text-[11px]">Memuat…</span>
              </div>
            ) : employees.length === 0 ? (
              <EmptyState
                icon={<Users size={18} />}
                title="Belum ada karyawan"
                description="Tambah karyawan lewat tombol + di atas."
              />
            ) : (
              <ul>
                {employees.map((e) => {
                  const isSel = e.id === selectedId;
                  const bought = (e.sales ?? []).filter((p) => p.purchased).length;
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => selectEmployee(e.id)}
                        className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition ${
                          isSel
                            ? "bg-[var(--ad-accent-soft)]"
                            : "hover:bg-[var(--ad-surface-2)]"
                        }`}
                      >
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold ${
                            isSel
                              ? "bg-[var(--ad-accent)] text-white"
                              : "bg-[var(--ad-surface-2)] text-[var(--ad-text-2)]"
                          }`}
                        >
                          {e.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-[12.5px] font-semibold ${
                              isSel
                                ? "text-[var(--ad-accent)]"
                                : "text-[var(--ad-text)]"
                            }`}
                          >
                            {e.full_name}
                          </p>
                          <p className="text-[10px] text-[var(--ad-text-3)]">
                            {bought} terbeli
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

        {/* ============ Right: per-employee ============ */}
        <div className="min-w-0 flex-1 space-y-4">
          {!selected ? (
            <AdminCard>
              <EmptyState
                icon={<CheckSquare size={20} />}
                title="Pilih karyawan dulu"
                description="Klik salah satu di kiri untuk set harga khusus & ceklis produk."
              />
            </AdminCard>
          ) : (
            <>
              {/* Employee header + summary */}
              <AdminCard>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-bold tracking-tight text-[var(--ad-text)]">
                      {selected.full_name}
                    </h2>
                    <p className="mt-0.5 text-[11px] text-[var(--ad-text-3)]">
                      {summary?.purchased ?? 0} / {selected.sales.length} produk
                      terbeli
                    </p>
                  </div>
                  {summary && summary.purchased > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="ad-inset p-2.5">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--ad-text-3)]">
                          Rata-rata Margin
                        </p>
                        <p
                          className={`mt-0.5 text-[14px] font-bold tabular-nums ${
                            summary.avgMargin >= 0
                              ? "text-[var(--ad-green)]"
                              : "text-[var(--ad-red)]"
                          }`}
                        >
                          {rupiah(summary.avgMargin)}
                        </p>
                      </div>
                      <div className="ad-inset p-2.5">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--ad-text-3)]">
                          Total Margin
                        </p>
                        <p
                          className={`mt-0.5 text-[14px] font-bold tabular-nums ${
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
                        <th className="w-10 !py-2.5">✓</th>
                        <th className="!py-2.5">Produk</th>
                        <th className="!py-2.5 text-right">Harga Jual</th>
                        <th className="!py-2.5 text-right">HPP</th>
                        <th className="!py-2.5 text-right">Harga Khusus</th>
                        <th className="!py-2.5 text-right">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selected.sales ?? []).map((p) => {
                        const d = drafts.get(p.id) ?? {
                          productId: p.id,
                          purchased: false,
                          specialPrice: null,
                          hppTyped: null,
                          hppTouched: false,
                        };
                        const sp = d.specialPrice ?? p.sell_price;
                        const hppNow = hppForDisplay(p, d);
                        const margin = sp - hppNow;
                        const hppValue = d.hppTouched
                          ? d.hppTyped
                          : p.hpp_snapshot;
                        const label = hppLabel(p, d);
                        return (
                          <tr
                            key={p.id}
                            className={
                              d.purchased ? "bg-[var(--ad-green-soft)]" : ""
                            }
                          >
                            <td className="text-center">
                              <input
                                type="checkbox"
                                checked={d.purchased}
                                onChange={() => togglePurchased(p.id)}
                                className="h-4 w-4 accent-[var(--ad-green)]"
                                title="Sudah beli / belum"
                              />
                            </td>
                            <td>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[12.5px] font-semibold text-[var(--ad-text)]">
                                  {p.name}
                                </span>
                                {p.has_variants && <Pill tone="blue">V</Pill>}
                              </div>
                            </td>
                            <td className="text-right text-[12px] tabular-nums text-[var(--ad-text)]">
                              {p.sale_price != null && (
                                <span className="mr-1 text-[10px] line-through text-[var(--ad-text-3)]">
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
                                value={hppValue != null ? String(hppValue) : ""}
                                onChange={(e) => setHpp(p.id, e.target.value)}
                                placeholder={String(p.hpp_per_unit)}
                                title="HPP khusus karyawan ini. Kosongkan = pakai HPP Kalkulator."
                                className="ad-input ml-auto w-[100px] !py-1 !text-[12px] tabular-nums"
                              />
                              {label && (
                                <div
                                  className={`mt-0.5 text-right text-[9px] ${
                                    label === "custom"
                                      ? "text-[var(--ad-amber)]"
                                      : label === "tercatat"
                                      ? "text-[var(--ad-green)]"
                                      : "text-[var(--ad-text-3)]"
                                  }`}
                                >
                                  {label}
                                </div>
                              )}
                            </td>
                            <td className="text-right">
                              <input
                                type="number"
                                min="0"
                                step="5000"
                                value={
                                  d.specialPrice != null
                                    ? String(d.specialPrice)
                                    : ""
                                }
                                onChange={(e) =>
                                  setSpecialPrice(p.id, e.target.value)
                                }
                                placeholder={String(p.sell_price)}
                                title="Kosongkan = harga jual reguler"
                                className="ad-input ml-auto w-[110px] !py-1 !text-[12px] tabular-nums"
                              />
                            </td>
                            <td
                              className={`text-right text-[12.5px] font-bold tabular-nums ${
                                margin >= 0
                                  ? "text-[var(--ad-green)]"
                                  : "text-[var(--ad-red)]"
                              }`}
                            >
                              {rupiah(margin)}
                              <span className="ml-1 text-[10px] font-medium text-[var(--ad-text-3)]">
                                ({sp > 0
                                  ? ((margin / sp) * 100).toFixed(1)
                                  : "0"}%)
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
                <div className="text-[11px] text-[var(--ad-text-3)]">
                  {dirty ? (
                    <span className="font-semibold text-[var(--ad-amber)]">
                      • Ada perubahan belum disimpan
                    </span>
                  ) : savedAt ? (
                    <span>✓ Tersimpan {savedAt}</span>
                  ) : (
                    <span>Belum ada perubahan</span>
                  )}
                </div>
                <AdminButton
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving || !dirty || !draftsBelongsToSelected}
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
