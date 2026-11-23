"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  X,
  Lock,
  Package,
  ShieldCheck,
  Sparkles,
  CreditCard,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useLoginModal } from "@/components/LoginModalProvider";
import { useCartContext } from "@/components/CartProvider";
import { supabasePublic } from "@/lib/supabasePublic";
import { useT } from "@/components/LocaleProvider";
import type { CartCopy } from "@/lib/i18n/types";

function formatPrice(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

interface ProductMeta {
  id: string;
  name: string;
  slug: string;
  price: number;
  is_active: boolean;
  image_url: string | null;
  size: string | null;
  stock: number | null;
}

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { open: openLoginModal } = useLoginModal();
  const {
    items,
    loading: cartLoading,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCartContext();
  const cartCopy: CartCopy = useT().cart;

  const [products, setProducts] = useState<Record<string, ProductMeta>>({});
  const [variants, setVariants] = useState<Record<string, { size?: string | null; option1Name?: string | null; option1Value?: string | null; option2Name?: string | null; option2Value?: string | null; stock?: number | null; sku?: string | null }>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const autoRedirectedRef = useRef(false);

  // Auto-dismiss toasts
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // If a signed-in user lands here with no items at all, still show the
  // empty-cart UI (don't bounce them to /products).
  useEffect(() => {
    if (!authLoading && !user && !autoRedirectedRef.current) {
      // Guest: stay on the page but render the login prompt below.
      autoRedirectedRef.current = true;
    }
  }, [authLoading, user]);

  // Enrich cart items with product + variant metadata so the UI can show
  // names, prices, images, and stock. We only fetch metadata for items we
  // have, so guests (items=[]) skip this entirely.
  useEffect(() => {
    if (!user || items.length === 0) {
      setProducts({});
      setVariants({});
      return;
    }

    let cancelled = false;
    const productIds = Array.from(new Set(items.map((i) => i.product_id)));
    const variantIds = Array.from(
      new Set(items.map((i) => i.variant_id).filter(Boolean) as string[])
    );

    (async () => {
      try {
        const [{ data: prods }, { data: vars }] = await Promise.all([
          supabasePublic
            .from("products")
            .select("id, name, slug, price, is_active, product_images(image_url, sort_order)")
            .in("id", productIds),
          supabasePublic
            .from("product_variants")
            .select("id, option_1_name, option_1_value, option_2_name, option_2_value, stock, sku")
            .in("id", variantIds),
        ]);

        if (cancelled) return;

        const next: Record<string, ProductMeta> = {};
        (prods ?? []).forEach((p: any) => {
          const sortedImages = [...(p.product_images || [])].sort(
            (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
          );
          next[p.id] = {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: Number(p.price ?? 0),
            is_active: p.is_active !== false,
            image_url: sortedImages[0]?.image_url ?? null,
            size: null,
            stock: null,
          };
        });
        setProducts(next);

        const nextVars: Record<string, {
          option1Name: string | null;
          option1Value: string | null;
          option2Name: string | null;
          option2Value: string | null;
          stock: number | null;
          sku: string | null;
        }> = {};
        (vars ?? []).forEach((v: any) => {
          nextVars[v.id] = {
            option1Name: v.option_1_name ?? null,
            option1Value: v.option_1_value ?? null,
            option2Name: v.option_2_name ?? null,
            option2Value: v.option_2_value ?? null,
            stock: v.stock ?? null,
            sku: v.sku ?? null,
          };
        });
        setVariants(nextVars);
      } catch (err) {
        console.error("Cart enrich error:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, items]);

  const handleUpdateQuantity = useCallback(
    async (id: string | undefined, currentQty: number, delta: number) => {
      if (!id) return;
      const newQty = currentQty + delta;
      if (newQty <= 0) {
        await handleRemove(id);
        return;
      }
      setActionLoading(id);
      try {
        await updateQuantity(id, newQty);
      } catch (err) {
        console.error("updateQuantity error:", err);
        setToast({ type: "error", msg: "Gagal memperbarui jumlah" });
      } finally {
        setActionLoading(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateQuantity]
  );

  const handleRemove = useCallback(
    async (id: string | undefined) => {
      if (!id) return;
      setActionLoading(id);
      try {
        await removeItem(id);
        setToast({ type: "success", msg: "Item dihapus dari keranjang" });
      } catch (err) {
        console.error("removeItem error:", err);
        setToast({ type: "error", msg: "Gagal menghapus item" });
      } finally {
        setActionLoading(null);
      }
    },
    [removeItem]
  );

  // Subtotal uses the price from the row joined with the current product price
  // (cart_items.price_at_add is the locked-in price; the join price is the
  // live one — we trust the locked-in price).
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const totalItems = useMemo(
    () => items.reduce((s, i) => s + i.quantity, 0),
    [items]
  );

  // ------------------------- RENDER: AUTH LOADING -------------------------
  if (authLoading) {
    return (
      <>
        <Navbar />
        <main className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-theme-primary px-4 py-16">
          <div
            className="pointer-events-none absolute -top-40 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
            style={{ background: "radial-gradient(circle, var(--accent-color), transparent 70%)" }}
          />
          <div className="relative flex items-center gap-3 text-theme-secondary">
            <Loader2 className="h-5 w-5 animate-spin accent-text" />
            <span className="text-sm tracking-wide">MEMUAT KERANJANG…</span>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ------------------------- RENDER: GUEST -------------------------
  if (!user) {
    const redirectTo = "/cart";
    return (
      <>
        <Navbar />
        <main className="relative overflow-hidden bg-theme-primary px-4 py-14 lg:py-20">
          {/* Ambient glow */}
          <div
            className="pointer-events-none absolute -top-48 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-30 blur-[130px]"
            style={{ background: "radial-gradient(circle, var(--accent-color), transparent 70%)" }}
          />
          <div
            className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full opacity-20 blur-[100px]"
            style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
          />

          <div className="relative mx-auto flex min-h-[60vh] max-w-md items-center justify-center">
            <div className="w-full">
              <div className="rounded-3xl border border-theme bg-theme-card p-8 text-center backdrop-blur-xl sm:p-10">
                <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-2xl border border-theme bg-theme-card shadow-[0_0_40px_-10px_rgba(215,255,83,0.25)]">
                  <ShoppingCart className="h-8 w-8 accent-text" strokeWidth={1.5} />
                </div>

                <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-theme-secondary/50">
                  Akses Dibatasi
                </div>
                <h1 className="text-2xl font-black tracking-tight text-theme-primary sm:text-3xl">
                  {cartCopy.title}
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-theme-secondary">
                  Keranjang hanya tersedia untuk customer yang sudah login.
                </p>
                <p className="mt-1.5 text-xs text-theme-secondary/50">
                  Silakan login atau daftar untuk mulai belanja.
                </p>

                <div className="mt-9 space-y-3">
                  <button
                    type="button"
                    onClick={() => openLoginModal({ mode: "login", redirectTo })}
                    className="group flex w-full items-center justify-center gap-2.5 rounded-xl py-4 text-sm font-black tracking-tight text-black transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_30px_-5px_rgba(215,255,83,0.4)] active:scale-[0.98]"
                    style={{ backgroundColor: "var(--accent-color)" }}
                  >
                    <Lock className="h-4 w-4 transition-transform group-hover:rotate-[-6deg]" />
                    Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => openLoginModal({ mode: "register", redirectTo })}
                    className="w-full rounded-xl border border-theme bg-transparent py-4 text-sm font-bold text-theme-primary transition-all duration-200 hover:border-white/40 hover:bg-white/5 active:scale-[0.98]"
                  >
                    Daftar Akun Baru
                  </button>
                </div>

                <div className="mt-8 border-t border-theme pt-6">
                  <Link
                    href="/products"
                    className="group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-theme-secondary/60 transition-all hover:text-theme-primary"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                    Kembali Belanja
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ------------------------- RENDER: AUTHED USER -------------------------
  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden bg-theme-primary">
        {/* Ambient glow layers */}
        <div
          className="pointer-events-none fixed -top-40 right-0 h-[450px] w-[550px] rounded-full opacity-25 blur-[130px]"
          style={{ background: "radial-gradient(circle, var(--accent-color), transparent 70%)" }}
        />
        <div
          className="pointer-events-none fixed bottom-0 left-0 h-[350px] w-[350px] rounded-full opacity-15 blur-[110px]"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
        />

        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
          {/* ─── Toast ─── */}
          {toast && (
            <div
              className={`mb-6 flex items-center justify-between rounded-xl border px-5 py-3.5 text-sm font-medium backdrop-blur-md transition-all ${
                toast.type === "success"
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {toast.type === "success" ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                <span>{toast.msg}</span>
              </div>
              <button
                onClick={() => setToast(null)}
                className="rounded-md p-1.5 transition-colors hover:bg-white/10"
                aria-label="Tutup notifikasi"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* ─── Page header ─── */}
          <header className="mb-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-px w-8 bg-theme-secondary/30" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-theme-secondary/60">
                    {cartCopy.title}
                  </span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-theme-primary sm:text-4xl lg:text-[2.75rem]">
                  {items.length > 0
                    ? `${totalItems} Item`
                    : "Keranjangmu"}
                </h1>
                {items.length > 0 && (
                  <p className="mt-1.5 text-sm text-theme-secondary/70">
                    Pilih ukuran, atur jumlah, lalu checkout.
                  </p>
                )}
              </div>

              {items.length > 0 && (
                <Link
                  href="/products"
                  className="group hidden items-center gap-2 rounded-full border border-theme px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-theme-secondary transition-all duration-200 hover:border-white/30 hover:bg-white/5 hover:text-theme-primary sm:flex"
                >
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                  Lanjut Belanja
                </Link>
              )}
            </div>
          </header>

          {/* ─── Cart loading ─── */}
          {cartLoading ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-theme bg-theme-card p-20 backdrop-blur-sm">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-2xl opacity-40 blur-xl"
                  style={{ background: "var(--accent-color)" }}
                />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-theme bg-theme-card">
                  <Loader2 className="h-6 w-6 animate-spin accent-text" />
                </div>
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.15em] text-theme-secondary/60">
                Memuat Keranjangmu
              </p>
            </div>
          ) : items.length === 0 ? (
            /* ─── EMPTY STATE ─── */
            <div className="flex flex-col items-center justify-center rounded-3xl border border-theme bg-theme-card p-12 sm:p-16">
              <div className="relative mb-8">
                <div
                  className="absolute inset-0 rounded-3xl opacity-20 blur-2xl"
                  style={{ background: "var(--accent-color)" }}
                />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-theme bg-theme-card">
                  <ShoppingCart className="h-10 w-10 text-theme-secondary/40" strokeWidth={1.25} />
                </div>
              </div>

              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-theme-secondary/50">
                Belum Ada Item
              </div>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-theme-primary sm:text-3xl">
                Keranjangmu masih kosong
              </h2>
              <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-theme-secondary/70">
                Yuk mulai belanja sekarang! Temukan koleksi terbaik untukmu dan
                bangun keranjang impianmu.
              </p>

              <button
                onClick={() => router.push("/products")}
                className="group mt-10 flex items-center gap-2.5 rounded-2xl px-10 py-4 text-sm font-black uppercase tracking-wider text-black transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_40px_-8px_rgba(215,255,83,0.5)] active:scale-[0.97]"
                style={{ backgroundColor: "var(--accent-color)" }}
              >
                <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
                Mulai Belanja
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          ) : (
            /* ─── CART ITEMS + SUMMARY (responsive: stacked / side-by-side) ─── */
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_minmax(360px,420px)] lg:gap-10">
              {/* ═══ LEFT: ITEMS LIST ═══ */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-theme-secondary/50">
                    Item ({totalItems})
                  </span>
                  <button
                    onClick={() => {
                      if (confirm("Hapus semua item dari keranjang?")) {
                        clearCart().catch(() =>
                          setToast({ type: "error", msg: "Gagal menghapus keranjang" })
                        );
                      }
                    }}
                    className="group flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-theme-secondary/50 transition-all hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                    Hapus Semua
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => {
                    const meta = products[item.product_id];
                    const variant = item.variant_id ? variants[item.variant_id] : null;
                    const imageSrc = meta?.image_url;
                    const stock = variant?.stock ?? null;
                    const isLoading = actionLoading === item.id;
                    const overStock = stock !== null && item.quantity > stock;

                    const variantLabel = variant
                      ? [
                          variant.option1Name ? `${variant.option1Name}: ${variant.option1Value}` : undefined,
                          variant.option2Name ? `${variant.option2Name}: ${variant.option2Value}` : undefined,
                        ]
                          .filter(Boolean)
                          .join("  ·  ")
                      : item.size?.trim() || "";

                    return (
                      <article
                        key={item.id}
                        className="group relative overflow-hidden rounded-2xl border border-theme bg-theme-card p-5 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] sm:p-6"
                        style={{ animationDelay: `${idx * 60}ms` }}
                      >
                        {/* subtle left accent bar on hover */}
                        <div className="absolute left-0 top-0 h-full w-[3px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                          style={{ background: "var(--accent-color)" }}
                        />

                        <div className="flex gap-4 sm:gap-5">
                          {/* Product image */}
                          <Link
                            href={`/products/${meta?.slug || ""}`}
                            className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#0a0a0a] sm:h-28 sm:w-28"
                          >
                            {imageSrc ? (
                              <Image
                                src={imageSrc}
                                alt={meta?.name || item.name || "Produk"}
                                fill
                                sizes="112px"
                                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-[#0d0d0d]">
                                <Package className="h-7 w-7 text-theme-secondary/20" strokeWidth={1.5} />
                              </div>
                            )}
                            {/* image overlay gradient */}
                            <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
                          </Link>

                          {/* Product info + controls (stacked on mobile) */}
                          <div className="flex flex-1 flex-col justify-between gap-4 min-w-0 sm:flex-row sm:items-start">
                            {/* Info block */}
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-[15px] font-bold tracking-tight text-theme-primary sm:text-base">
                                {meta?.name || item.name || "Produk"}
                              </h3>

                              {variantLabel && (
                                <div className="mt-1.5">
                                  <span className="inline-block rounded-md border border-theme bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium tracking-wide text-theme-secondary">
                                    {variantLabel}
                                  </span>
                                </div>
                              )}

                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="text-base font-black tracking-tight text-theme-primary sm:text-lg">
                                  {formatPrice(item.price)}
                                </span>
                                {item.quantity > 1 && (
                                  <span className="text-xs text-theme-secondary/50 tabular-nums">
                                    × {item.quantity}
                                  </span>
                                )}
                              </div>

                              {/* Status badges */}
                              <div className="mt-3 flex flex-wrap gap-2">
                                {meta && !meta.is_active && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400">
                                    <X className="h-2.5 w-2.5" />
                                    Tidak aktif
                                  </span>
                                )}
                                {overStock && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                    <Package className="h-2.5 w-2.5" />
                                    Stok tersisa {stock}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Controls: quantity + line total + remove */}
                            <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                              {/* Quantity stepper */}
                              <div className="flex items-center gap-0.5 rounded-full border border-theme bg-[#0a0a0a]/60 p-1 backdrop-blur-sm">
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                                  disabled={item.quantity <= 1 || !!actionLoading}
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-theme-secondary transition-all duration-200 hover:bg-white/10 hover:text-theme-primary active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed"
                                  aria-label="Kurangi jumlah"
                                >
                                  {isLoading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Minus className="h-4 w-4" />
                                  )}
                                </button>
                                <span className="w-9 text-center text-sm font-black text-theme-primary tabular-nums select-none">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                                  disabled={!!actionLoading || overStock}
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-theme-secondary transition-all duration-200 hover:bg-white/10 hover:text-theme-primary active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed"
                                  aria-label="Tambah jumlah"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>

                              {/* Line total + remove */}
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-theme-primary tabular-nums">
                                  {formatPrice(item.price * item.quantity)}
                                </span>
                                <button
                                  onClick={() => handleRemove(item.id)}
                                  disabled={!!actionLoading}
                                  className="group/remove relative flex h-8 w-8 items-center justify-center rounded-full text-theme-secondary/40 transition-all duration-200 hover:bg-red-500/15 hover:text-red-400 active:scale-90 disabled:opacity-25 disabled:cursor-not-allowed"
                                  aria-label="Hapus item"
                                >
                                  <X className="h-4 w-4 transition-transform duration-200 group-hover/remove:scale-110" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Mobile-only "continue shopping" link */}
                <button
                  onClick={() => router.push("/products")}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-theme py-3.5 text-xs font-bold uppercase tracking-wider text-theme-secondary/70 transition-all hover:border-white/25 hover:text-theme-primary sm:hidden"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Lanjut Belanja
                </button>
              </div>

              {/* ═══ RIGHT: ORDER SUMMARY ═══ */}
              <aside>
                <div className="relative overflow-hidden rounded-3xl border border-theme bg-theme-card p-6 backdrop-blur-xl lg:sticky lg:top-24 lg:p-8">
                  {/* top accent line */}
                  <div
                    className="absolute inset-x-0 top-0 h-[3px]"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, var(--accent-color), transparent)",
                    }}
                  />

                  <div className="mb-1 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 accent-text" strokeWidth={2} />
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-theme-secondary/50">
                      Ringkasan Pesanan
                    </h2>
                  </div>

                  {/* Breakdown */}
                  <dl className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <dt className="text-sm font-medium text-theme-secondary/80">
                        Subtotal
                      </dt>
                      <dd className="text-sm font-bold text-theme-primary tabular-nums">
                        {formatPrice(subtotal)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-sm font-medium text-theme-secondary/80">
                        Jumlah Item
                      </dt>
                      <dd className="text-sm font-bold text-theme-primary tabular-nums">
                        {totalItems}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-sm font-medium text-theme-secondary/80">
                        Pengiriman
                      </dt>
                      <dd className="text-xs font-bold uppercase tracking-wider text-theme-secondary/50">
                        Dihitung di checkout
                      </dd>
                    </div>
                  </dl>

                  <div className="my-6 h-px bg-gradient-to-r from-transparent via-theme to-transparent" />

                  {/* Total */}
                  <div className="flex items-end justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-theme-secondary/50">
                      Total Estimasi
                    </span>
                    <span
                      className="text-2xl font-black tracking-tight sm:text-[1.75rem]"
                      style={{ color: "var(--accent-color)" }}
                    >
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => router.push("/checkout")}
                    className="group mt-7 flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-wider text-black transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_40px_-6px_rgba(215,255,83,0.45)] active:scale-[0.98]"
                    style={{ backgroundColor: "var(--accent-color)" }}
                  >
                    Lanjut ke Checkout
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>

                  {/* Trust badges */}
                  <div className="mt-6 grid grid-cols-2 gap-2.5">
                    <div className="flex items-center gap-2 rounded-xl border border-theme/60 bg-white/[0.02] px-3 py-2.5">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-theme-secondary/50" />
                      <span className="text-[11px] font-semibold leading-tight text-theme-secondary/60">
                        Pembayaran Aman
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-theme/60 bg-white/[0.02] px-3 py-2.5">
                      <Package className="h-4 w-4 shrink-0 text-theme-secondary/50" />
                      <span className="text-[11px] font-semibold leading-tight text-theme-secondary/60">
                        Gratis Retur 7 Hari
                      </span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
