"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Package,
  Plus,
  Search,
  Copy,
  Eye,
  Pencil,
  Power,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { rupiah } from "@/lib/format";
import { useToast } from "@/components/Toast";

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

function getStatusBadge(status: AdminProduct["status"], stock: number): { label: string; cls: string } {
  if (status === "archived") return { label: "Arsip", cls: "bg-white/10 text-white/55 border-white/10" };
  if (status === "inactive") return { label: "Nonaktif", cls: "bg-red-500/15 text-red-300 border-red-500/30" };
  if (status === "draft") return { label: "Draft", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" };
  if (stock <= 0) return { label: "Stok Habis", cls: "bg-red-500/15 text-red-300 border-red-500/30" };
  return { label: "Aktif", cls: "bg-[#d7ff53]/15 text-[#d7ff53] border-[#d7ff53]/30" };
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

  return (
    <AdminShell title="Produk" adminName={adminName} adminEmail={adminEmail}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d7ff53]">
            Manajemen
          </p>
          <h1 className="mt-1 text-2xl font-black uppercase tracking-tight md:text-3xl">
            Produk
          </h1>
          <p className="mt-1 text-sm text-white/55">
            Tambah, edit, dan kelola produk WALI.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#d7ff53] px-5 py-3 text-[11px] font-black uppercase tracking-wider text-black transition hover:scale-[1.01] hover:bg-white"
        >
          <Plus size={14} />
          Tambah Produk
        </Link>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Total</p>
          <p className="mt-1.5 text-2xl font-black">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Aktif</p>
          <p className="mt-1.5 text-2xl font-black text-[#d7ff53]">{stats.active}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Stok Habis</p>
          <p className="mt-1.5 text-2xl font-black text-red-300">{stats.outOfStock}</p>
        </div>
      </section>

      {/* Filters bar */}
      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
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
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari nama, SKU, merek..."
                className="w-full rounded-full border border-white/10 bg-black/40 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#d7ff53]"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/40 transition hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="rounded-full bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-black transition hover:bg-[#d7ff53]"
            >
              Cari
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white/65 outline-none focus:border-[#d7ff53]"
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
              className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white/65 outline-none focus:border-[#d7ff53]"
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
                className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white/65 outline-none focus:border-[#d7ff53]"
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
              className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white/65 outline-none focus:border-[#d7ff53]"
            >
              <option value="updated_at">Terakhir Diubah</option>
              <option value="created_at">Terbaru</option>
              <option value="name">Nama</option>
              <option value="base_price">Harga</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white/65 transition hover:bg-white/10"
            >
              {sortDir === "desc" ? "↓" : "↑"}
            </button>
          </div>
        </form>
      </section>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#d7ff53]/30 bg-[#d7ff53]/5 p-3">
          <span className="text-xs font-bold text-[#d7ff53]">
            {selectedIds.size} dipilih
          </span>
          <div className="h-4 w-px bg-white/20" />
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[11px] font-bold text-white/70 outline-none focus:border-[#d7ff53]"
          >
            <option value="">Pilih aksi</option>
            <option value="activate">Aktifkan</option>
            <option value="deactivate">Nonaktifkan</option>
            <option value="archive">Arsipkan</option>
            <option value="delete">Hapus</option>
            <option value="feature">Tandai Unggulan</option>
            <option value="unfeature">Hapus Unggulan</option>
          </select>
          <button
            onClick={handleBulkAction}
            disabled={!bulkAction}
            className="rounded-full bg-[#d7ff53] px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-black transition hover:bg-white disabled:opacity-40"
          >
            Terapkan
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-bold text-white/60 transition hover:bg-white/10"
          >
            Batal
          </button>
        </div>
      )}

      {/* Product table */}
      <section className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] py-20">
            <Loader2 size={24} className="animate-spin text-white/40" />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-white/50">
              <Package size={20} />
            </div>
            <h3 className="text-base font-black uppercase">Tidak ada produk</h3>
            <p className="mt-1 text-xs text-white/45">
              {q || statusFilter || stockFilter || categoryFilter
                ? "Tidak ada produk yang cocok dengan filter."
                : "Mulai dengan menambah produk pertama."}
            </p>
            {!q && !statusFilter && !stockFilter && !categoryFilter && (
              <Link
                href="/admin/products/new"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#d7ff53] px-5 py-2.5 text-[11px] font-black uppercase tracking-wider text-black transition hover:bg-white"
              >
                <Plus size={14} />
                Tambah Produk
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-[10px] font-black uppercase tracking-wider text-white/40">
                    <th className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === products.length && products.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 accent-[#d7ff53]"
                      />
                    </th>
                    <th className="px-3 py-3">Produk</th>
                    <th className="hidden px-3 py-3 md:table-cell">SKU</th>
                    <th className="hidden px-3 py-3 sm:table-cell">Kategori</th>
                    <th className="px-3 py-3">Harga</th>
                    <th className="px-3 py-3 text-center">Varian</th>
                    <th className="px-3 py-3 text-center">Stok</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="hidden px-3 py-3 md:table-cell">Diubah</th>
                    <th className="px-3 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const badge = getStatusBadge(p.status, p.stock);
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.02]"
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="h-4 w-4 accent-[#d7ff53]"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                              {p.image_url ? (
                                <Image
                                  src={p.image_url}
                                  alt={p.name}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-[8px] font-black text-white/35">
                                  N/A
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-white" title={p.name}>
                                {p.name}
                              </p>
                              <p className="truncate text-[11px] text-white/45">
                                {p.brand || p.category || "Tanpa kategori"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-3 py-3 text-[11px] font-mono text-white/60 md:table-cell">
                          {p.sku || "—"}
                        </td>
                        <td className="hidden px-3 py-3 text-[11px] text-white/60 sm:table-cell">
                          {p.category || "—"}
                        </td>
                        <td className="px-3 py-3">
                          {p.sale_price !== null && p.base_price !== null && p.sale_price < p.base_price ? (
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="text-[11px] font-bold text-[#d7ff53] line-through">
                                {rupiah(p.sale_price)}
                              </span>
                              <span className="text-xs font-black text-white">
                                {rupiah(p.base_price)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold text-white">
                              {p.has_variants
                                ? `${rupiah(p.min_price)} – ${rupiah(p.max_price)}`
                                : rupiah(p.base_price || p.min_price)}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center text-white/70">{p.variant_count}</td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={
                              p.stock === 0
                                ? "font-black text-red-300"
                                : p.stock <= 5
                                  ? "font-bold text-yellow-300"
                                  : "font-bold text-white/85"
                            }
                          >
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="hidden px-3 py-3 text-[11px] text-white/55 md:table-cell">
                          {new Date(p.updated_at).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/products/${p.slug}`}
                              target="_blank"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 transition hover:bg-white/5 hover:text-white"
                              title="Lihat"
                            >
                              <Eye size={13} />
                            </Link>
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 transition hover:bg-white/5 hover:text-white"
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDuplicate(p.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 transition hover:bg-white/5 hover:text-white"
                              title="Duplikasi"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(p.id, p.status)}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition hover:bg-white/5 ${
                                p.status === "active"
                                  ? "border-white/10 text-white/60 hover:text-white"
                                  : "border-[#d7ff53]/20 text-[#d7ff53]/80 hover:text-[#d7ff53]"
                              }`}
                              title={p.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                            >
                              <Power size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id, p.name)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 text-red-300/80 transition hover:bg-red-500/10 hover:text-red-300"
                              title="Hapus"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-white/40">
              Menampilkan {(page - 1) * perPage + 1}–
              {Math.min(page * perPage, total)} dari {total} produk
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 transition disabled:opacity-30 hover:bg-white/5"
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
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                      page === pageNum
                        ? "bg-[#d7ff53] text-black"
                        : "border border-white/10 text-white/60 hover:bg-white/5"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 transition disabled:opacity-30 hover:bg-white/5"
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
