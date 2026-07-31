"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Search,
  ImageIcon,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Power,
  Loader2,
} from "lucide-react";
import { toggleBannerStatus, deleteBanner } from "@/app/admin/banners/actions";

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

  return (
    <>
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              name="q"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama banner..."
              className="w-full rounded-full border border-white/10 bg-black/40 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#d7ff53]"
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
            className="rounded-full border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-[#d7ff53]"
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
            className="rounded-full border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-[#d7ff53]"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
          {hasFilter && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/70 transition hover:border-white/30 hover:text-white"
            >
              Reset
            </button>
          )}
        </form>
      </section>

      {(error || actionError) && (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-300">
          {error ?? actionError}
        </div>
      )}

      <section className="mt-6">
        {banners.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-white/50">
              <ImageIcon size={20} />
            </div>
            <h3 className="text-base font-black uppercase">Belum ada banner</h3>
            <p className="mt-1 text-xs text-white/45">
              {hasFilter
                ? "Coba ubah filter atau kata kunci pencarian."
                : "Tambah banner pertama untuk ditampilkan di homepage."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-[10px] font-black uppercase tracking-wider text-white/40">
                    <th className="px-4 py-3">Banner</th>
                    <th className="px-3 py-3">Posisi</th>
                    <th className="px-3 py-3 text-center">Urutan</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Tanggal</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {banners.map((b) => {
                    const rowPending = pendingId === b.id && isPending;
                    return (
                      <tr
                        key={b.id}
                        className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={b.image_url}
                                alt={b.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-white">
                                {b.title}
                              </p>
                              {b.button_text && (
                                <p className="mt-0.5 truncate text-[11px] text-white/45">
                                  CTA: {b.button_text}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white/70">
                            {POSITION_LABEL[b.position] ?? b.position}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-white">
                          {b.sort_order}
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggle(b.id, !b.status)}
                            disabled={rowPending}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition disabled:opacity-60 ${
                              b.status
                                ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:border-emerald-400/60"
                                : "border border-white/10 bg-white/[0.04] text-white/55 hover:border-white/30"
                            }`}
                          >
                            {rowPending ? (
                              <Loader2
                                size={10}
                                className="animate-spin"
                                strokeWidth={2.5}
                              />
                            ) : (
                              <Power size={10} strokeWidth={2.5} />
                            )}
                            {b.status ? "Aktif" : "Nonaktif"}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-[11px] text-white/55">
                          {fmtDateTime(b.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/banners/${b.id}/edit`}
                              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-bold text-white/70 transition hover:border-white/30 hover:text-white"
                            >
                              <Pencil size={12} strokeWidth={2.4} />
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(b.id, b.title)}
                              disabled={rowPending}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-bold text-red-300 transition hover:border-red-500/40 hover:bg-red-500/20 disabled:opacity-60"
                            >
                              {rowPending ? (
                                <Loader2
                                  size={12}
                                  className="animate-spin"
                                  strokeWidth={2.5}
                                />
                              ) : (
                                <Trash2 size={12} strokeWidth={2.4} />
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-white/55">
                <span>
                  Halaman {page} dari {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={buildHref(Math.max(1, page - 1))}
                    aria-disabled={page <= 1}
                    className={`inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-bold transition ${
                      page <= 1
                        ? "pointer-events-none opacity-40"
                        : "hover:border-white/30 hover:text-white"
                    }`}
                  >
                    <ChevronLeft size={12} strokeWidth={2.5} />
                    Prev
                  </Link>
                  <Link
                    href={buildHref(Math.min(totalPages, page + 1))}
                    aria-disabled={page >= totalPages}
                    className={`inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-bold transition ${
                      page >= totalPages
                        ? "pointer-events-none opacity-40"
                        : "hover:border-white/30 hover:text-white"
                    }`}
                  >
                    Next
                    <ChevronRight size={12} strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
