-- ============================================================
-- 006_admin_role_and_rls.sql
-- Adds admin role to profiles, audit log table, store_settings,
-- and overhauls RLS so the admin web app can use Supabase Auth
-- while customers remain limited to their own data.
-- ============================================================

-- 1) Add role column on profiles (defaults to customer)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer'
    CHECK (role IN ('admin', 'customer'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2) Make sure the profile auto-create trigger sets role to customer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Ensure trigger exists (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3) Helper: is_admin() reading role of current auth user
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 4) Admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before JSONB,
  after JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.admin_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.admin_audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.admin_audit_log(created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- No direct reads from the client. Admin views use the server (service role)
-- and render redacted output to authorized users only.
DROP POLICY IF EXISTS "audit log no client access" ON public.admin_audit_log;
CREATE POLICY "audit log no client access" ON public.admin_audit_log
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- 5) Store settings (server-managed)
CREATE TABLE IF NOT EXISTS public.store_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store settings admin read" ON public.store_settings;
CREATE POLICY "store settings admin read" ON public.store_settings
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "store settings no client write" ON public.store_settings;
CREATE POLICY "store settings no client write" ON public.store_settings
  FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "store settings no client update" ON public.store_settings;
CREATE POLICY "store settings no client update" ON public.store_settings
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "store settings no client delete" ON public.store_settings;
CREATE POLICY "store settings no client delete" ON public.store_settings
  FOR DELETE
  USING (false);

-- ============================================================
-- 6) Profiles RLS
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles self read" ON public.profiles;
CREATE POLICY "profiles self read" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles self update" ON public.profiles;
CREATE POLICY "profiles self update" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Customer cannot escalate role
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

DROP POLICY IF EXISTS "profiles admin update" ON public.profiles;
CREATE POLICY "profiles admin update" ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "profiles insert by trigger" ON public.profiles;
CREATE POLICY "profiles insert by trigger" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- ============================================================
-- 7) Products, variants, images — public catalog + admin CRUD
-- ============================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products public read active" ON public.products;
CREATE POLICY "products public read active" ON public.products
  FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "products admin write" ON public.products;
CREATE POLICY "products admin write" ON public.products
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product images public read" ON public.product_images;
CREATE POLICY "product images public read" ON public.product_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND (p.is_active = true OR public.is_admin())
    )
  );
DROP POLICY IF EXISTS "product images admin write" ON public.product_images;
CREATE POLICY "product images admin write" ON public.product_images
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product variants public read" ON public.product_variants;
CREATE POLICY "product variants public read" ON public.product_variants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND (p.is_active = true OR public.is_admin())
    )
  );
DROP POLICY IF EXISTS "product variants admin write" ON public.product_variants;
CREATE POLICY "product variants admin write" ON public.product_variants
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- 8) Carts / cart_items — owner only
-- ============================================================
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "carts owner read" ON public.carts;
CREATE POLICY "carts owner read" ON public.carts
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "carts owner write" ON public.carts;
CREATE POLICY "carts owner write" ON public.carts
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cart items owner read" ON public.cart_items;
CREATE POLICY "cart items owner read" ON public.cart_items
  FOR SELECT
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "cart items owner write" ON public.cart_items;
CREATE POLICY "cart items owner write" ON public.cart_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid()
    )
  );

-- ============================================================
-- 9) Orders / order_items — customer owns, admin manages
-- ============================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders customer read" ON public.orders;
CREATE POLICY "orders customer read" ON public.orders
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

-- Customer can insert (checkout), but server must set price fields.
DROP POLICY IF EXISTS "orders customer insert" ON public.orders;
CREATE POLICY "orders customer insert" ON public.orders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Customer cannot update order (status, payment). Admin can.
DROP POLICY IF EXISTS "orders admin update" ON public.orders;
CREATE POLICY "orders admin update" ON public.orders
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only admin/service can delete orders
DROP POLICY IF EXISTS "orders admin delete" ON public.orders;
CREATE POLICY "orders admin delete" ON public.orders
  FOR DELETE
  USING (public.is_admin());

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order items read" ON public.order_items;
CREATE POLICY "order items read" ON public.order_items
  FOR SELECT
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "order items server write" ON public.order_items;
CREATE POLICY "order items server write" ON public.order_items
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- 10) Seed default store settings
-- ============================================================
INSERT INTO public.store_settings (key, value) VALUES
  ('store_name', 'WALI Merch'),
  ('store_whatsapp', '6281234567890'),
  ('store_email', 'halo@walimerch.id'),
  ('low_stock_threshold', '5')
ON CONFLICT (key) DO NOTHING;
