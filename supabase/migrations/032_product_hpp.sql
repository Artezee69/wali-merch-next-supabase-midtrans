-- ============================================================
-- 032_product_hpp.sql
-- Tabel HPP per produk untuk halaman kalkulator HPP admin.
--
-- Struktur: satu row per produk (product_id unique).
--   hpp_items      : JSON array biaya-biaya HPP
--                     [{id, name, fixed:boolean, amount, qty?}]
--   overhead_items : JSON array overhead [{id, name, amount}]
--   sales_fee      : potongan tetap untuk sales (default 10000)
--   kantor_share   : persen bagian kantor (default 40)
--   studio_share   : persen bagian studio (default 60)
--
-- Harga jual & nama produk DIAMBIL dari tabel products pada
-- pemakaian — tidak digandakan di sini, jadi selalu up-to-date.
--
-- Purely additive: tidak menyentuh tabel lain.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_hpp (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL UNIQUE
                 REFERENCES public.products(id) ON DELETE CASCADE,
  hpp_items      JSONB NOT NULL DEFAULT '[]'::jsonb,
  overhead_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  sales_fee      INTEGER NOT NULL DEFAULT 10000,
  kantor_share   INTEGER NOT NULL DEFAULT 40,
  studio_share   INTEGER NOT NULL DEFAULT 60,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_product_hpp_touch_updated_at ON public.product_hpp;
CREATE TRIGGER trg_product_hpp_touch_updated_at
  BEFORE UPDATE ON public.product_hpp
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.product_hpp ENABLE ROW LEVEL SECURITY;

-- Halaman ini memakai service role dari Next.js (bypass RLS),
-- tapi tetap buat policy admin agar aman bila diakses lewat anon/user.
DROP POLICY IF EXISTS "product_hpp admin read" ON public.product_hpp;
CREATE POLICY "product_hpp admin read"
  ON public.product_hpp FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "product_hpp admin write" ON public.product_hpp;
CREATE POLICY "product_hpp admin write"
  ON public.product_hpp FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
