"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Loader2,
  Package,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { rupiah } from "@/lib/format";
import { useToast } from "@/components/Toast";
import {
  AdminButton,
  AdminCard,
  AdminLink,
  EmptyState,
  Pill,
  type PillTone,
} from "@/components/admin/ui";

// ===== Types =====

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  brand: string | null;
  category: string | null;
  sku: string | null;
  status: "draft" | "active" | "inactive" | "archived";
  base_price: number | null;
  sale_price: number | null;
  is_featured: boolean;
  has_variants: boolean;
  stock: number;
  min_price: number;
  max_price: number;
  image_url: string | null;
  variant_count: number;
  updated_at: string;
  created_at: string;
};

function getStatusBadge(
  status: AdminProduct["status"],
  stock: number
): { label: string; tone: PillTone } {
  if (status === "archived") return { label: "Arsip", tone: "neutral" };
  if (status === "inactive") return { label: "Nonaktif", tone: "red" };
  if (status === "draft") return { label: "Draft", tone: "amber" };
  if (stock <= 0) return { label: "Stok Habis", tone: "red" };
  return { label: "Aktif", tone: "green" };
}

export type AdminProductsClientProps = {
  adminName: string | null;
  adminEmail: string | null;
};

export default function AdminProductsClient({
  adminName,
  adminEmail,
}: AdminProductsClientProps) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 20;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Filters
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Bulk
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, outOfStock: 0 });

  // Toasts (use the global ToastProvider mounted in root layout)
  const toast = useToast();
  const addToast = useCallback(
    (msg: string, type?: "success" | "error" | "info") => {
      toast.show(msg, type || "success");
    },
    [toast]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    if (debouncedQ) params.set("q", debouncedQ);
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (stockFilter) params.set("stock", stockFilter);
    params.set("sort_by", sortBy);
    params.set("order", sortDir);

    try {
      const res = await fetch(`/api/admin/products?${params}`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to load products");
      }
      const data = await res.json();
      setProducts(data.products);
      setTotal(data.total);
    } catch {
      addToast("Gagal memuat produk", "error");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, debouncedQ, statusFilter, stockFilter, categoryFilter, sortBy, sortDir, addToast]);

  // Stats fetch (separate)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/products?page=1&per_page=500");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const prods = data.products ?? [];
        const active = prods.filter((p: AdminProduct) => p.status === "active" && p.stock > 0).length;
        const oos = prods.filter((p: AdminProduct) => p.status === "active" && p.stock === 0).length;
        setStats({ total: data.total, active, outOfStock: oos });
      } catch {
        // ignore
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () =>
      [
        ...new Set(
          products
            .map((p) => p.category)
            .filter((c): c is string => typeof c === "string" && c.length > 0)
        ),
      ].sort(),
    [products]
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  }

  async function handleBulkAction() {
    if (selectedIds.size === 0 || !bulkAction) return;
    if (bulkAction === "delete") {
      if (!confirm(`Hapus ${selectedIds.size} produk? Tindakan ini tidak dapat dibatalkan.`)) return;
    }
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: bulkAction, ids: [...selectedIds] }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Bulk action failed");
      }
      addToast(`Bulk ${bulkAction} berhasil (${selectedIds.size} produk)`);
      setSelectedIds(new Set());
      setBulkAction("");
      fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bulk action gagal";
      addToast(msg, "error");
    }
  }

  async function handleToggleStatus(id: string, currentStatus: string) {
    const newStatus: AdminProduct["status"] = currentStatus === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Toggle failed");
      }
      addToast(newStatus === "active" ? "Produk diaktifkan" : "Produk dinonaktifkan");
      fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengubah status";
      addToast(msg, "error");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      const isSoft = (await res.json()).soft_deleted;
      addToast(
        isSoft
          ? `Produk "${name}" dinonaktifkan (berpotensi ada order)`
          : `Produk "${name}" berhasil dihapus`
      );
      fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus produk";
      addToast(msg, "error");
    }
  }

  async function handleDuplicate(id: string) {
    try {
      const res = await fetch("/api/admin/products/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Duplicate failed");
      }
      const result = await res.json();
      addToast(`Produk "${result.product.name}" berhasil diduplikasi (draft)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menduplikasi produk";
      addToast(msg, "error");
    }
  }

  const filterSelect = "ad-input w-auto min-w-[150px] !rounded-lg !py-1.5 text-[13px]";

  return (
    <AdminShell title="Produk" subtitle="Tambah, edit, dan kelola produk WALI" adminName={adminName} adminEmail={adminEmail}>
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ad-text-3)]">
            Admin / Produk
          </p>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #16181d, #5d6470)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Produk
          </h1>
          <p className="mt-0.5 text-[13px] text-[var(--ad-text-3)]">
            Kelola katalog, stok, dan varian toko kamu.
          </p>
        </div>
        <AdminLink href="/admin/products/new">
          <Plus size={14} /> Tambah Produk
        </AdminLink>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3">
        <StatTile label="Total" value={stats.total} borderAccent="#2563eb" />
        <StatTile label="Aktif" value={stats.active} tone="green" borderAccent="#16a34a" />
        <StatTile label="Stok Habis" value={stats.outOfStock} tone="red" borderAccent="#dc2626" />
      </section>

      {/* Filters bar */}
      <AdminCard className="mt-4" style={{ background: "linear-gradient(to right, #ffffff, #f9fafb)" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
          }}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ad-text-3)]"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari nama, SKU, merek…"
                className="ad-input !rounded-lg pl-9"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--ad-text-3)] transition hover:text-[var(--ad-text)]"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="ad-btn ad-btn-secondary ad-btn-sm !rounded-lg"
            >
              <Search size={13} /> Cari
            </button>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className={filterSelect}
            >
              <option value="">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
              <option value="archived">Arsip</option>
            </select>

            <select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value);
                setPage(1);
              }}
              className={filterSelect}
            >
              <option value="">Semua Stok</option>
              <option value="in">Ada Stok</option>
              <option value="low">Stok Rendah</option>
              <option value="out">Habis</option>
            </select>

            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className={filterSelect}
              >
                <option value="">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={filterSelect}
            >
              <option value="updated_at">Terakhir Diubah</option>
              <option value="created_at">Terbaru</option>
              <option value="name">Nama</option>
              <option value="base_price">Harga</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
              title={sortDir === "desc" ? "Urutan menurun" : "Urutan menaik"}
              className="ad-btn ad-btn-secondary ad-btn-sm !rounded-lg !px-2.5"
            >
              {sortDir === "desc" ? "↓" : "↑"}
            </button>
          </div>
        </form>
      </AdminCard>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="ad-alert ad-alert-info mt-4 flex-wrap">
          <Pill tone="accent">{selectedIds.size} dipilih</Pill>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="ad-input w-auto min-w-[130px] !rounded-lg !py-1.5 text-[12px]"
          >
            <option value="">Pilih aksi…</option>
            <option value="activate">Aktifkan</option>
            <option value="deactivate">Nonaktifkan</option>
            <option value="archive">Arsipkan</option>
            <option value="delete">Hapus</option>
            <option value="feature">Tandai Unggulan</option>
            <option value="unfeature">Hapus Unggulan</option>
          </select>
          <AdminButton
            variant="primary"
            size="sm"
            onClick={handleBulkAction}
            disabled={!bulkAction}
          >
            Terapkan
          </AdminButton>
          <AdminButton variant="secondary" size="sm" onClick={() => setSelectedIds(new Set())}>
            Batal
          </AdminButton>
        </div>
      )}

      {/* Product table */}
      <section className="mt-4">
        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-[var(--ad-border)] bg-white py-20">
            <Loader2 size={22} className="animate-spin text-[var(--ad-text-3)]" />
          </div>
        ) : products.length === 0 ? (
          <AdminCard>
            <EmptyState
              icon={<Package size={20} />}
              title="Tidak ada produk"
              description={
                q || statusFilter || stockFilter || categoryFilter
                  ? "Tidak ada produk yang cocok dengan filter."
                  : "Mulai dengan menambah produk pertama."
              }
              action={
                !q && !statusFilter && !stockFilter && !categoryFilter ? (
                  <AdminLink href="/admin/products/new">
                    <Plus size={14} /> Tambah Produk
                  </AdminLink>
                ) : undefined
              }
            />
          </AdminCard>
        ) : (
          <AdminCard padded={false} className="overflow-hidden" style={{ boxShadow: "0 4px 12px rgba(16,24,40,0.06)" }}>
            {/* Mobile: card list */}
            <ul className="divide-y divide-[var(--ad-border-soft)] lg:hidden">
              {products.map((p) => {
                const badge = getStatusBadge(p.status, p.stock);
                const accentColor =
                  badge.tone === "green"
                    ? "var(--ad-green)"
                    : badge.tone === "red"
                      ? "var(--ad-red)"
                      : badge.tone === "amber"
                        ? "var(--ad-amber)"
                        : "var(--ad-text-3)";
                return (
                  <li key={p.id} className="p-3.5" style={{ borderTop: `2px solid ${accentColor}` }}>
                    <div className="flex items-start gap-3">
                      <ProductThumb url={p.image_url} name={p.name} sizeClass="h-11 w-11" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[13.5px] font-semibold text-[var(--ad-text)]">{p.name}</p>
                          {p.is_featured && <Pill tone="accent">Unggulan</Pill>}
                        </div>
                        <p className="mt-0.5 text-[11.5px] text-[var(--ad-text-3)]">
                          {p.category || p.brand || "Tanpa kategori"}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Pill tone={badge.tone}>{badge.label}</Pill>
                          <span className="text-[11px] text-[var(--ad-text-3)]">
                            Stok:{" "}
                            <span
                              className={
                                p.stock === 0
                                  ? "font-semibold text-[var(--ad-red)]"
                                  : p.stock <= 5
                                    ? "font-semibold text-[var(--ad-amber)]"
                                    : "font-semibold text-[var(--ad-text-2)]"
                              }
                            >
                              {p.stock}
                            </span>
                          </span>
                          <span className="ml-auto text-[12px] font-bold text-[var(--ad-text)]">
                            {p.sale_price != null && p.base_price != null && p.sale_price < p.base_price
                              ? rupiah(p.sale_price)
                              : p.has_variants
                                ? `${rupiah(p.min_price)}–${rupiah(p.max_price)}`
                                : rupiah(p.base_price || p.min_price)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Mobile actions */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="ad-btn ad-btn-secondary ad-btn-sm"
                      >
                        <Pencil size={11} /> Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(p.id, p.status)}
                        className={`ad-btn ad-btn-sm ${
                          p.status === "active"
                            ? "ad-btn-secondary"
                            : "ad-btn-primary !bg-[var(--ad-green)] !shadow-none"
                        }`}
                      >
                        <Power size={11} /> {p.status === "active" ? "Nonaktif" : "Aktif"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.name)}
                        className="ad-btn ad-btn-danger-outline ad-btn-sm"
                      >
                        <Trash2 size={11} /> Hapus
                      </button>
                      <Link
                        href={`/products/${p.slug}`}
                        target="_blank"
                        className="ad-btn ad-btn-secondary ad-btn-sm"
                      >
                        <Eye size={11} /> Lihat
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(p.id)}
                        className="ad-btn ad-btn-secondary ad-btn-sm"
                      >
                        <Copy size={11} /> Duplikat
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop: full table */}
            <div className="hidden lg:block">
              <table className="ad-table w-full">
                <thead>
                  <tr className="bg-[var(--ad-surface-2)]">
                    <th className="w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === products.length && products.length > 0}
                        onChange={toggleSelectAll}
                        className="ad-checkbox"
                      />
                    </th>
                    <th>Produk</th>
                    <th className="hidden xl:table-cell">SKU</th>
                    <th>Kategori</th>
                    <th>Harga</th>
                    <th className="hidden text-center xl:table-cell">Varian</th>
                    <th className="text-center">Stok</th>
                    <th>Status</th>
                    <th className="hidden xl:table-cell">Diubah</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const badge = getStatusBadge(p.status, p.stock);
                    return (
                      <tr key={p.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="ad-checkbox"
                          />
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <ProductThumb url={p.image_url} name={p.name} sizeClass="h-10 w-10" />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[var(--ad-text)]" title={p.name}>
                                {p.name}
                              </p>
                              <p className="truncate text-[11.5px] text-[var(--ad-text-3)]">
                                {p.brand || p.category || "Tanpa kategori"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden font-mono text-[11.5px] xl:table-cell">
                          {p.sku || "—"}
                        </td>
                        <td>{p.category || "—"}</td>
                        <td>
                          {p.sale_price !== null && p.base_price !== null && p.sale_price < p.base_price ? (
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="text-[11px] font-medium text-[var(--ad-text-3)] line-through">
                                {rupiah(p.base_price)}
                              </span>
                              <span className="text-[13px] font-bold text-[var(--ad-accent)]">
                                {rupiah(p.sale_price)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-semibold text-[var(--ad-text)]">
                              {p.has_variants
                                ? `${rupiah(p.min_price)} – ${rupiah(p.max_price)}`
                                : rupiah(p.base_price || p.min_price)}
                            </span>
                          )}
                        </td>
                        <td className="hidden text-center xl:table-cell">{p.variant_count}</td>
                        <td className="text-center">
                          <span
                            className={
                              p.stock === 0
                                ? "font-bold text-[var(--ad-red)]"
                                : p.stock <= 5
                                  ? "font-bold text-[var(--ad-amber)]"
                                  : "font-semibold text-[var(--ad-text)]"
                            }
                          >
                            {p.stock}
                          </span>
                        </td>
                        <td>
                          <Pill tone={badge.tone}>{badge.label}</Pill>
                        </td>
                        <td className="hidden text-[11.5px] xl:table-cell">
                          {new Date(p.updated_at).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/products/${p.slug}`}
                              target="_blank"
                              className="ad-btn ad-btn-secondary ad-btn-icon ad-btn-sm !border-transparent"
                              title="Lihat"
                            >
                              <Eye size={14} />
                            </Link>
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="ad-btn ad-btn-secondary ad-btn-icon ad-btn-sm !border-transparent"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDuplicate(p.id)}
                              className="ad-btn ad-btn-secondary ad-btn-icon ad-btn-sm !border-transparent"
                              title="Duplikasi"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(p.id, p.status)}
                              className={`ad-btn ad-btn-icon ad-btn-sm !border-transparent ${
                                p.status === "active"
                                  ? "text-[var(--ad-text-2)]"
                                  : "text-[var(--ad-green)]"
                              }`}
                              title={p.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                            >
                              <Power size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id, p.name)}
                              className="ad-btn ad-btn-icon ad-btn-sm !border-transparent text-[var(--ad-red)]"
                              title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AdminCard>
        )}

        {!loading && products.length > 0 && (
          <div className="mt-3.5 flex items-center justify-between">
            <p className="text-[12px] text-[var(--ad-text-3)]">
              Menampilkan {(page - 1) * perPage + 1}–
              {Math.min(page * perPage, total)} dari {total} produk
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="ad-btn ad-btn-secondary ad-btn-icon ad-btn-sm"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`ad-btn ad-btn-icon ad-btn-sm ${
                      page === pageNum ? "ad-btn-primary !shadow-none" : "ad-btn-secondary"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="ad-btn ad-btn-secondary ad-btn-icon ad-btn-sm"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>
    </AdminShell>
  );
}

/* ============== Small helpers ============== */

function StatTile({
  label,
  value,
  tone = "default",
  borderAccent,
}: {
  label: string;
  value: number;
  tone?: "default" | "green" | "red";
  borderAccent?: string;
}) {
  const color =
    tone === "green"
      ? "text-[var(--ad-green)]"
      : tone === "red"
        ? "text-[var(--ad-red)]"
        : "text-[var(--ad-text)]";
  return (
    <AdminCard
      className="!p-3.5"
      style={
        borderAccent
          ? { borderLeft: `4px solid ${borderAccent}` }
          : undefined
      }
    >
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--ad-text-3)]">
        {label}
      </p>
      <p className={`mt-1 text-[22px] font-bold leading-none ${color}`}>{value}</p>
    </AdminCard>
  );
}

function ProductThumb({
  url,
  name,
  sizeClass,
}: {
  url: string | null;
  name: string;
  sizeClass: string;
}) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-lg border border-[var(--ad-border)] bg-[var(--ad-surface-2)] ${sizeClass}`}>
      {url ? (
        <Image src={url} alt={name} fill sizes="44px" className="object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-[9px] font-bold text-[var(--ad-text-3)]">
          N/A
        </div>
      )}
    </div>
  );
}
