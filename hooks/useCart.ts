import { useCartContext as useCartContextRaw } from "@/components/CartProvider";

// Fallback when used outside CartProvider (e.g., on admin login page)
export function useCart() {
  try {
    return useCartContextRaw();
  } catch (error) {
    console.warn("useCart() called outside CartProvider, using fallback");
    return {
      items: [],
      total: 0,
      itemCount: 0,
      addItem: async () => false,
      removeItem: async () => {},
      updateQuantity: async () => {},
      clearCart: async () => {},
      loading: false,
      authReady: true,
    };
  }
}
