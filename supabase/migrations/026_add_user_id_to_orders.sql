-- 026_add_user_id_to_orders.sql
-- Link orders to the auth user so each account can view its own order history
-- and RLS can restrict cross-user access.

BEGIN;

-- Add user_id to orders (nullable: existing orders without a user can still be tracked by order_code)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Tighten RLS: authenticated users can read their own orders
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
CREATE POLICY "Users can read own orders" ON public.orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Also keep the public read-by-order-code policy (for the /order/[code] page)
-- so anyone with a valid order code can still view status.
-- This is intentional — the track-order page is public by design.

COMMIT;
