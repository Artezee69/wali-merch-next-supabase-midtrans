"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingCart, Trash2, Loader2 } from "lucide-react";
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
            .select("id, name, slug, price, is_active, product_images(image_url)")
            .in("id", productIds),
          supabasePublic
            .from("product_variants")
            .select("id, option_1_name, option_1_value, option_2_name, option_2_value, stock, sku")
            .in("id", variantIds),
        ]);

        if (cancelled) return;

        const next: Record<string, ProductMeta> = {};
        (prods ?? []).forEach((p: any) => {
          next[p.id] = {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: Number(p.price ?? 0),
            is_active: p.is_active !== false,
            image_url: p.product_images?.[0]?.image_url ?? null,
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

  // ------------------------- RENDER: AUTH LOADING -------------------------
  if (authLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-900 text-gray-300 dark:bg-black dark:text-gray-200 px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <p className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Memuat...
            </p>
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
        <main className="min-h-screen bg-gray-900 text-gray-300 dark:bg-black dark:text-gray-200 px-4 py-16">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <ShoppingCart size={56} className="mx-auto text-gray-300 dark:text-gray-600" />
            <h1 className="text-2xl font-black tracking-wide text-gray-900 dark:text-gray-100">
              Keranjang
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Keranjang hanya tersedia untuk customer yang sudah login.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Silakan login atau daftar terlebih dahulu untuk mulai belanja.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => openLoginModal({ mode: "login", redirectTo })}
                className="w-full rounded-xl bg-[#d7ff53] px-6 py-3 text-sm font-black text-black transition hover:bg-[#c7ef33] sm:w-auto"
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => openLoginModal({ mode: "register", redirectTo })}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-black text-white transition hover:border-white/30 sm:w-auto"
              >
                Daftar
              </button>
              <Link
                href="/products"
                className="w-full rounded-xl border border-white/10 px-6 py-3 text-sm font-bold text-white/70 transition hover:border-white/30 hover:text-white sm:w-auto"
              >
                Kembali Belanja
              </Link>
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
      <main className="min-h-screen bg-gray-900 text-gray-300 dark:bg-black dark:text-gray-200 px-4 py-16">
        <div className="mx-auto max-w-3xl space-y-6">
          {toast && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                toast.type === "success"
                  ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                  : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
              }`}
            >
              {toast.msg}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-black tracking-wide text-gray-900 dark:text-gray-100">
              {cartCopy.title}
            </h1>
          </div>

          {cartLoading ? (
            <div className="rounded-2xl border border-black/20 dark:border-white/10 bg-gray-50 dark:bg-gray-800/30 p-12 text-center">
              <p className="flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500 dark:text-gray-400" /> Memuat keranjang...
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-black/20 dark:border-white/10 bg-gray-50 dark:bg-gray-800/30 p-12 text-center">
              <div className="space-y-4">
                <ShoppingCart size={48} className="mx-auto mb-4 text-gray-500 dark:text-gray-400" />
                <div className="bg-green-600/10 dark:bg-green-900/20 rounded-xl px-4 py-3 border border-green-600/20 dark:border-green-900/30">
                  <p className="text-sm text-green-700 dark:text-green-400 font-bold">
                    Keranjangmu masih kosong 😊
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                    Yuk mulai belanja sekarang!
                  </p>
                </div>
                <button
                  onClick={() => router.push("/products")}
                  className="mt-4 rounded-xl bg-green-600 dark:bg-green-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-700 dark:hover:bg-green-500/90"
                >
                  Lihat Produk
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {items.map((item) => {
                  const meta = products[item.product_id];
                  const variant = variants[item.variant_id];
                  const imageSrc = meta?.image_url;
                  const stock = variant?.stock ?? null;

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800/30 p-4"
                    >
                      <div className="flex gap-4">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700/50">
                          {imageSrc ? (
                            <Image
                              src={imageSrc}
                              alt={meta?.name || item.name || "Produk"}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400 dark:text-gray-500">
                              Tidak ada gambar
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                            {meta?.name || item.name || "Produk"}
                          </h3>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {variant ? (
                              <span>
                                {[
                                  variant.option1Name ? `${variant.option1Name}: ${variant.option1Value}` : undefined,
                                  variant.option2Name ? `${variant.option2Name}: ${variant.option2Value}` : undefined,
                                ].filter(Boolean).join(", ") || "-"}
                              </span>
                            ) : (
                              item.size?.trim() ? item.size.trim() : "-"
                            )}
                          </div>
                          {meta && !meta.is_active && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                              Produk tidak aktif
                            </p>
                          )}
                          {stock !== null && item.quantity > stock && (
                            <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
                              Stok tersisa {stock}
                            </p>
                          )}
                          <p className="mt-1 text-sm font-bold text-green-700 dark:text-green-400">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item.id, item.quantity, -1)
                              }
                              disabled={
                                item.quantity <= 1 || !!actionLoading
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 transition hover:border-green-600 dark:hover:border-green-500 hover:text-green-700 dark:hover:text-green-400 disabled:opacity-30"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item.id, item.quantity, 1)
                              }
                              disabled={
                                !!actionLoading ||
                                (stock !== null && item.quantity >= stock)
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 transition hover:border-green-600 dark:hover:border-green-500 hover:text-green-700 dark:hover:text-green-400 disabled:opacity-30"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemove(item.id)}
                            disabled={!!actionLoading}
                            className="rounded-lg p-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 transition hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-30"
                            aria-label="Hapus item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800/30 p-6">
                <div className="mb-4 flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} item)
                  </span>
                  <span className="text-gray-900 dark:text-white font-bold">{formatPrice(subtotal)}</span>
                </div>
                <button
                  onClick={() => router.push("/checkout")}
                  className="w-full rounded-xl bg-green-600 dark:bg-green-500 py-3 text-sm font-black text-white transition hover:bg-green-700 dark:hover:bg-green-500/90"
                >
                  Ke Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
