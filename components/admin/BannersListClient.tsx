"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Power,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toggleBannerStatus, deleteBanner } from "@/app/admin/banners/actions";
import {
  AdminButton,
  AdminCard,
  EmptyState,
  Pill,
} from "@/components/admin/ui";

type BannerRow = {
  id: number;
  title: string;
  image_url: string;
  position: "hero" | "right_top" | "right_bottom";
  status: boolean;
  sort_order: number;
  button_text: string | null;
  button_link: string | null;
  created_at: string;
};

const POSITION_LABEL: Record<string, string> = {
  hero: "Hero Slider",
  right_top: "Promo Top",
  right_bottom: "Promo Bottom",
};

type Props = {
  banners: BannerRow[];
  total: number;
  page: number;
  totalPages: number;
  q: string;
  position: "" | "hero" | "right_top" | "right_bottom";
  status: "" | "active" | "inactive";
  error: string | null;
};

function fmtDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

export default function BannersListClient({
  banners,
  page,
  totalPages,
  q,
  position,
  status,
  error,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(q);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (targetPage >= 1) params.set("page", String(targetPage));
    else params.delete("page");
    const qs = params.toString();
    return qs ? `/admin/banners?${qs}` : "/admin/banners";
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) params.set("q", searchInput.trim());
    else params.delete("q");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/admin/banners?${qs}` : "/admin/banners");
  }

  function handleClearFilters() {
    setSearchInput("");
    router.push("/admin/banners");
  }

  async function handleToggle(id: number, next: boolean) {
    setActionError(null);
    setPendingId(id);
    startTransition(async () => {
      const res = await toggleBannerStatus(id, next);
      setPendingId(null);
      if (!res.ok) setActionError(res.error || "Gagal mengubah status.");
      else router.refresh();
    });
  }

  async function handleDelete(id: number, title: string) {
    if (
      !window.confirm(
        `Hapus banner "${title}"? Gambar di storage juga akan dihapus.`
      )
    )
      return;
    setActionError(null);
    setPendingId(id);
    startTransition(async () => {
      const res = await deleteBanner(id);
      setPendingId(null);
      if (!res.ok) setActionError(res.error || "Gagal menghapus banner.");
      else router.refresh();
    });
  }

  const hasFilter = q || position || status;

  const selectCls = "ad-input w-auto min-w-[140px] !rounded-lg !py-2 text-[13px]";

  return (
    <>
      {/* Filters */}
      <AdminCard style={{ background: "linear-gradient(to right, #ffffff, #f9fafb)" }}>
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ad-text-3)]"
            />
            <input
              name="q"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama banner…"
              className="ad-input !rounded-lg pl-9"
            />
          </div>
          <select
            name="position"
            defaultValue={position}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) params.set("position", e.target.value);
              else params.delete("position");
              params.delete("page");
              const qs = params.toString();
              router.push(qs ? `/admin/banners?${qs}` : "/admin/banners");
            }}
            className={selectCls}
          >
            <option value="">Semua Posisi</option>
            <option value="hero">Hero Slider</option>
            <option value="right_top">Promo Top</option>
            <option value="right_bottom">Promo Bottom</option>
          </select>
          <select
            name="status"
            defaultValue={status}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) params.set("status", e.target.value);
              else params.delete("status");
              params.delete("page");
              const qs = params.toString();
              router.push(qs ? `/admin/banners?${qs}` : "/admin/banners");
            }}
            className={selectCls}
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
          {hasFilter && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="ad-btn ad-btn-secondary !rounded-lg"
            >
              <X size={12} /> Reset
            </button>
          )}
        </form>
      </AdminCard>

      {(error || actionError) && (
        <div className="ad-alert ad-alert-error mt-4">{error ?? actionError}</div>
      )}

      <section className="mt-4">
        {banners.length === 0 ? (
          <AdminCard>
            <EmptyState
              icon={<ImageIcon size={20} />}
              title="Belum ada banner"
              description={
                hasFilter
                  ? "Coba ubah filter atau kata kunci pencarian."
                  : "Tambah banner pertama untuk ditampilkan di homepage."
              }
            />
          </AdminCard>
        ) : (
          <AdminCard padded={false} className="overflow-hidden">
            {/* Mobile cards */}
            <div className="flex flex-col gap-3 p-3 lg:hidden">
              <table className="ad-table w-full">
                <thead>
                  <tr
                    className="bg-[var(--ad-surface-2)]"
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      background: "white",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                    }}
                  >
                    <th>Banner</th>
                    <th>Posisi</th>
                    <th className="text-center">Urutan</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {banners.map((b) => {
                    const rowPending = pendingId === b.id && isPending;
                    return (
                      <tr key={b.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--ad-border)] bg-[var(--ad-surface-2)]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={b.image_url}
                                alt={b.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[var(--ad-text)]">
                                {b.title}
                              </p>
                              {b.button_text && (
                                <p className="mt-0.5 truncate text-[11.5px] text-[var(--ad-text-3)]">
                                  CTA: {b.button_text}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <Pill tone="neutral">{POSITION_LABEL[b.position] ?? b.position}</Pill>
                        </td>
                        <td className="text-center font-semibold text-[var(--ad-text)]">
                          {b.sort_order}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggle(b.id, !b.status)}
                            disabled={rowPending}
                            className={`ad-btn ad-btn-sm !rounded-full !px-3 ${
                              b.status
                                ? "!border-[#bbf7d0] !bg-[var(--ad-green-soft)] !text-[var(--ad-green)]"
                                : "ad-btn-secondary"
                            }`}
                          >
                            {rowPending ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Power size={11} />
                            )}
                            {b.status ? "Aktif" : "Nonaktif"}
                          </button>
                        </td>
                        <td className="text-[11.5px]">{fmtDateTime(b.created_at)}</td>
                        <td>
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/admin/banners/${b.id}/edit`}
                              className="ad-btn ad-btn-secondary ad-btn-sm"
                            >
                              <Pencil size={12} /> Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(b.id, b.title)}
                              disabled={rowPending}
                              className="ad-btn ad-btn-danger-outline ad-btn-sm"
                            >
                              {rowPending ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Trash2 size={12} />
                              )}
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Desktop: full table */}
            <div className="hidden overflow-x-auto lg:block">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-[var(--ad-border)] bg-[var(--ad-surface-2)] p-3"
                  style={{ borderTop: `2px solid ${b.status ? "#16a34a" : "#dc2626"}` }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--ad-border)] bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.image_url} alt={b.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[var(--ad-text)]">{b.title}</p>
                      <p className="text-[11px] text-[var(--ad-text-3)]">
                        {POSITION_LABEL[b.position] ?? b.position} · Urutan {b.sort_order}
                      </p>
                    </div>
                    <Pill tone={b.status ? "green" : "neutral"}>{b.status ? "Aktif" : "Nonaktif"}</Pill>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-1.5">
                    <span className="text-[11px] text-[var(--ad-text-3)]">{fmtDateTime(b.created_at)}</span>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/admin/banners/${b.id}/edit`} className="ad-btn ad-btn-secondary ad-btn-sm">
                        <Pencil size={12} /> Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(b.id, b.title)}
                        disabled={pendingId === b.id && isPending}
                        className="ad-btn ad-btn-danger-outline ad-btn-sm"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--ad-border-soft)] px-4 py-3 text-[12px] text-[var(--ad-text-3)]">
                <span>
                  Halaman {page} dari {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={buildHref(Math.max(1, page - 1))}
                    aria-disabled={page <= 1}
                    className={`ad-btn ad-btn-secondary ad-btn-sm ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
                  >
                    <ChevronLeft size={12} /> Prev
                  </Link>
                  <Link
                    href={buildHref(Math.min(totalPages, page + 1))}
                    aria-disabled={page >= totalPages}
                    className={`ad-btn ad-btn-secondary ad-btn-sm ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
                  >
                    Next <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            )}
          </AdminCard>
        )}
      </section>
    </>
  );
}
