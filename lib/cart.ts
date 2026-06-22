import { supabasePublic } from "./supabasePublic";

/**
 * Get or create cart for a user. Must be called server-side with service role key
 * or with auth context. Returns cart ID.
 */
export async function getOrCreateCart(
  userId: string,
  serviceKey?: boolean
): Promise<{ cartId: string; error?: string }> {
  const client = serviceKey ? undefined : supabasePublic; // use default client (RLS)

  // Try to get existing cart
  const { data: existing, error: fetchError } = await supabasePublic
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    return { cartId: "", error: fetchError.message };
  }

  if (existing) {
    return { cartId: existing.id };
  }

  // Create new cart
  const { data: created, error: createError } = await supabasePublic
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (createError) {
    return { cartId: "", error: createError.message };
  }

  return { cartId: created.id };
}

/**
 * Get cart for a user (must exist). Fails if no cart.
 */
export async function getCart(userId: string): Promise<{ id: string } | null> {
  const { data, error } = await supabasePublic
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getCart error:", error);
    return null;
  }

  return data;
}

/**
 * Get all cart items with product/variant info
 */
export async function getCartItems(cartId: string) {
  const { data, error } = await supabasePublic
    .from("cart_items")
    .select(
      `
      *,
      product_id,
      product:product_id (
        id,
        name,
        slug,
        price,
        is_active
      ),
      product_variants!cart_items_variant_id_fkey (
        id,
        size,
        stock
      )
    `
    )
    .eq("cart_id", cartId);

  if (error) {
    console.error("getCartItems error:", error);
    return [];
  }

  return data;
}

/**
 * Add item to cart. Upserts if product+variant already exists.
 * Server-side: validates product exists and is active.
 */
export async function addCartItem(
  cartId: string,
  userId: string,
  productId: string,
  variantId: string,
  quantity: number,
  priceAtAdd: number
): Promise<{ success: boolean; error?: string }> {
  // Validate product exists and is active
  const { data: product, error: productError } = await supabasePublic
    .from("products")
    .select("id, is_active")
    .eq("id", productId)
    .maybeSingle();

  if (productError) {
    return { success: false, error: "Gagal memverifikasi produk." };
  }

  if (!product) {
    return { success: false, error: "Produk tidak ditemukan." };
  }

  if (!product.is_active) {
    return { success: false, error: "Produk ini tidak tersedia." };
  }

  // Get variant stock
  const { data: variant } = await supabasePublic
    .from("product_variants")
    .select("stock")
    .eq("id", variantId)
    .maybeSingle();

  if (!variant) {
    return { success: false, error: "Ukuran produk tidak ditemukan." };
  }

  const maxStock = Number(variant.stock || 0);
  const safeQuantity = Math.min(Math.max(1, quantity), maxStock);

  if (maxStock <= 0) {
    return { success: false, error: "Stok ukuran ini sudah habis." };
  }

  // Upsert cart item
  const { error: upsertError } = await supabasePublic
    .from("cart_items")
    .upsert(
      {
        cart_id: cartId,
        product_id: productId,
        variant_id: variantId,
        quantity: safeQuantity,
        price_at_add: priceAtAdd,
      },
      {
        onConflict: "cart_id,product_id,variant_id",
      }
    );

  if (upsertError) {
    return { success: false, error: upsertError.message };
  }

  return { success: true };
}

/**
 * Update quantity of a cart item (with stock validation)
 */
export async function updateCartItemQuantity(
  cartItemId: string,
  newQuantity: number
): Promise<{ success: boolean; error?: string }> {
  if (newQuantity <= 0) {
    return { success: false, error: "Jumlah harus lebih dari 0." };
  }

  // Get current cart item to check product and variant
  const { data: cartItem } = await supabasePublic
    .from("cart_items")
    .select("variant_id, product_id")
    .eq("id", cartItemId)
    .maybeSingle();

  if (!cartItem) {
    return { success: false, error: "Item keranjang tidak ditemukan." };
  }

  // Get variant stock
  const { data: variant } = await supabasePublic
    .from("product_variants")
    .select("stock")
    .eq("id", cartItem.variant_id)
    .maybeSingle();

  const maxStock = Number(variant?.stock || 99);
  const safeQuantity = Math.min(Math.max(1, newQuantity), maxStock);

  const { error } = await supabasePublic
    .from("cart_items")
    .update({ quantity: safeQuantity })
    .eq("id", cartItemId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Remove a cart item
 */
export async function removeCartItem(cartItemId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabasePublic
    .from("cart_items")
    .delete()
    .eq("id", cartItemId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Clear all items from cart
 */
export async function clearCart(cartId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabasePublic
    .from("cart_items")
    .delete()
    .eq("cart_id", cartId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
