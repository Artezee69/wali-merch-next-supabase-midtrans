"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { supabasePublic } from "@/lib/supabasePublic";
import { useAuth } from "@/hooks/useAuth";
import { useLoginModal } from "@/components/LoginModalProvider";
import { useToast } from "@/components/Toast";
import type { CartItem } from "@/lib/types";

/**
 * CartItem is the UI shape (id, name, slug, size, price, image_url, ...).
 * cart_items in the DB has: id, cart_id, product_id, variant_id, quantity,
 * price_at_add, created_at, updated_at. We map DB rows to CartItem and back.
 */
type CartRow = {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  price_at_add: number;
  created_at?: string;
  updated_at?: string;
};

export type AddToCartInput = Omit<CartItem, "quantity"> & { quantity?: number };

type CartContextValue = {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (item: AddToCartInput) => Promise<boolean>;
  removeItem: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loading: boolean;
  authReady: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used within CartProvider");
  return ctx;
}

function rowToItem(row: CartRow, fallback: Partial<CartItem> = {}): CartItem {
  return {
    id: row.id,
    product_id: row.product_id,
    variant_id: row.variant_id,
    name: fallback.name ?? "",
    slug: fallback.slug ?? "",
    size: fallback.size ?? "",
    price: row.price_at_add,
    image_url: fallback.image_url,
    quantity: row.quantity,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { open: openLoginModal } = useLoginModal();
  const toast = useToast();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const lastLoadedUserIdRef = useRef<string | null>(null);
  const itemsRef = useRef<CartItem[]>([]);
  itemsRef.current = items;

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // ---------------------------------------------------------------
  // Cart loader: wait for auth, then load (or clear) for that user.
  // ---------------------------------------------------------------
  useEffect(() => {
    if (authLoading) {
      // Don't query the DB until AuthProvider is done bootstrapping the session.
      return;
    }

    if (!user) {
      // Guest: never query, never block, never keep stale items around.
      setItems([]);
      setLoading(false);
      lastLoadedUserIdRef.current = null;
      return;
    }

    let mounted = true;
    const userId = user.id;
    setLoading(true);

    (async () => {
      try {
        // 1. Get or create the user's active cart.
        let cartId: string | null = null;

        const { data: existing, error: existingErr } = await supabasePublic
          .from("carts")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingErr) {
          console.error("Cart load error (select cart):", existingErr);
        } else if (existing?.id) {
          cartId = existing.id;
        } else {
          const { data: created, error: createErr } = await supabasePublic
            .from("carts")
            .insert({ user_id: userId })
            .select("id")
            .single();

          if (createErr) {
            console.error("Cart load error (create cart):", createErr);
          } else if (created?.id) {
            cartId = created.id;
          }
        }

        if (!mounted) return;

        if (!cartId) {
          setItems([]);
          setLoading(false);
          lastLoadedUserIdRef.current = userId;
          return;
        }

        // 2. Load cart items for that cart.
        const { data: cartItems, error: itemsErr } = await supabasePublic
          .from("cart_items")
          .select("id, cart_id, product_id, variant_id, quantity, price_at_add, created_at, updated_at")
          .eq("cart_id", cartId)
          .order("created_at", { ascending: false });

        if (itemsErr) {
          console.error("Cart load error (select items):", itemsErr);
        }

        if (!mounted) return;

        const rows = (cartItems as CartRow[] | null) ?? [];
        setItems(rows.map((r) => rowToItem(r)));
        setLoading(false);
        lastLoadedUserIdRef.current = userId;
      } catch (err) {
        console.error("Cart load unexpected error:", err);
        if (mounted) {
          setItems([]);
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [authLoading, user?.id]);

  // ---------------------------------------------------------------
  // Get-or-create cart id for the currently signed-in user.
  // ---------------------------------------------------------------
  const getOrCreateCartId = useCallback(async (userId: string): Promise<string | null> => {
    const { data: existing, error: existingErr } = await supabasePublic
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingErr) {
      console.error("getOrCreateCartId (select) error:", existingErr);
      return null;
    }

    if (existing?.id) return existing.id;

    const { data: created, error: createErr } = await supabasePublic
      .from("carts")
      .insert({ user_id: userId })
      .select("id")
      .single();

    if (createErr) {
      console.error("getOrCreateCartId (insert) error:", createErr);
      return null;
    }

    return created?.id ?? null;
  }, []);

  // ---------------------------------------------------------------
  // addItem — single entry point used by every "Tambah ke Keranjang" button.
  // ---------------------------------------------------------------
  const addItem = useCallback(
    async (item: AddToCartInput): Promise<boolean> => {
      const productId = item.product_id;
      const variantId = item.variant_id;
      const qty = Math.max(1, item.quantity ?? 1);

      console.log("Add to cart:", {
        hasUser: Boolean(user),
        productId,
        variantId,
        quantity: qty,
        authReady: !authLoading,
      });

      // If auth hasn't been resolved yet, wait briefly so we don't show the
      // login modal to a customer who is actually signed in.
      if (authLoading) {
        return false;
      }

      // Guest: open the login modal and bail. No DB writes.
      if (!user) {
        openLoginModal({ mode: "login" });
        return false;
      }

      if (!productId || !variantId) {
        toast.show("Produk atau ukuran tidak valid.", "error");
        return false;
      }

      const userId = user.id;

      // 1. Ensure cart exists.
      const cartId = await getOrCreateCartId(userId);
      if (!cartId) {
        console.error("Cart database error: failed to obtain cart_id for user", userId);
        toast.show("Gagal menambahkan produk ke keranjang.", "error");
        return false;
      }

      // 2. Validate product and variant.
      const { data: productData, error: productErr } = await supabasePublic
        .from("products")
        .select("id, is_active, price")
        .eq("id", productId)
        .maybeSingle();

      if (productErr) {
        console.error("Cart database error (product):", productErr);
        toast.show("Gagal menambahkan produk ke keranjang.", "error");
        return false;
      }
      if (!productData || productData.is_active === false) {
        toast.show("Produk ini tidak tersedia.", "error");
        return false;
      }

      const { data: variantData, error: variantErr } = await supabasePublic
        .from("product_variants")
        .select("id, stock, size")
        .eq("id", variantId)
        .maybeSingle();

      if (variantErr) {
        console.error("Cart database error (variant):", variantErr);
        toast.show("Gagal menambahkan produk ke keranjang.", "error");
        return false;
      }
      if (!variantData) {
        toast.show("Varian produk tidak ditemukan.", "error");
        return false;
      }

      const stock = Number(variantData.stock || 0);
      if (stock <= 0) {
        toast.show("Stok produk habis.", "error");
        return false;
      }

      const priceAtAdd = Number(productData.price ?? item.price ?? 0);

      // 3. Check if item already exists in this cart.
      const existing = itemsRef.current.find((i) => i.variant_id === variantId);
      const finalQty = Math.min(stock, (existing?.quantity ?? 0) + qty);

      if (existing) {
        // 4a. Update existing row.
        const { data: updatedRow, error: updateErr } = await supabasePublic
          .from("cart_items")
          .update({
            quantity: finalQty,
            price_at_add: priceAtAdd,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select("id, cart_id, product_id, variant_id, quantity, price_at_add, created_at, updated_at")
          .single();

        if (updateErr || !updatedRow) {
          console.error("Cart database error (update):", updateErr);
          toast.show("Gagal memperbarui keranjang.", "error");
          return false;
        }

        setItems((prev) =>
          prev.map((i) =>
            i.id === existing.id
              ? rowToItem(updatedRow as CartRow, {
                  name: i.name,
                  slug: i.slug,
                  size: i.size || variantData.size || "",
                  image_url: i.image_url,
                })
              : i
          )
        );
      } else {
        // 4b. Insert new row.
        const { data: insertedRow, error: insertErr } = await supabasePublic
          .from("cart_items")
          .insert({
            cart_id: cartId,
            product_id: productId,
            variant_id: variantId,
            quantity: qty,
            price_at_add: priceAtAdd,
          })
          .select("id, cart_id, product_id, variant_id, quantity, price_at_add, created_at, updated_at")
          .single();

        if (insertErr || !insertedRow) {
          console.error("Cart database error (insert):", insertErr);
          toast.show("Gagal menambahkan produk ke keranjang.", "error");
          return false;
        }

        const newItem = rowToItem(insertedRow as CartRow, {
          name: item.name,
          slug: item.slug,
          size: item.size || variantData.size || "",
          image_url: item.image_url,
        });

        setItems((prev) => [newItem, ...prev]);
      }

      toast.show("Produk ditambahkan ke keranjang.", "success");
      return true;
    },
    [user, authLoading, toast, openLoginModal, getOrCreateCartId]
  );

  // ---------------------------------------------------------------
  // removeItem / updateQuantity / clearCart — operate on real DB ids.
  // ---------------------------------------------------------------
  const removeItem = useCallback(
    async (cartItemId: string) => {
      if (!user) return;

      const { error } = await supabasePublic
        .from("cart_items")
        .delete()
        .eq("id", cartItemId);

      if (error) {
        console.error("Cart database error (delete):", error);
        toast.show("Gagal menghapus item.", "error");
        return;
      }

      setItems((prev) => prev.filter((i) => i.id !== cartItemId));
    },
    [user, toast]
  );

  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      if (!user) return;
      if (quantity <= 0) {
        await removeItem(cartItemId);
        return;
      }

      // Stock check before writing.
      const target = itemsRef.current.find((i) => i.id === cartItemId);
      if (target) {
        const { data: variantData } = await supabasePublic
          .from("product_variants")
          .select("stock")
          .eq("id", target.variant_id)
          .maybeSingle();

        const stock = Number(variantData?.stock || 0);
        if (stock > 0 && quantity > stock) {
          toast.show("Jumlah melebihi stok tersedia.", "error");
          return;
        }
      }

      const { error } = await supabasePublic
        .from("cart_items")
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq("id", cartItemId);

      if (error) {
        console.error("Cart database error (update qty):", error);
        toast.show("Gagal memperbarui jumlah.", "error");
        return;
      }

      setItems((prev) =>
        prev.map((i) => (i.id === cartItemId ? { ...i, quantity } : i))
      );
    },
    [user, removeItem, toast]
  );

  const clearCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    const cartId = await getOrCreateCartId(user.id);
    if (!cartId) return;

    const { error } = await supabasePublic
      .from("cart_items")
      .delete()
      .eq("cart_id", cartId);

    if (error) {
      console.error("Cart database error (clear):", error);
      toast.show("Gagal mengosongkan keranjang.", "error");
      return;
    }

    setItems([]);
  }, [user, getOrCreateCartId, toast]);

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        itemCount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        loading,
        authReady: !authLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
