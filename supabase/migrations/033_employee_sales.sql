-- ============================================================
-- 033_employee_sales.sql
-- Pelacakan penjualan produk ke karyawan (harga khusus, max 1 per produk).
--
-- Satu baris per (employee_id, product_id) — unik.
--   employee_id   : id unik karyawan (dibuat server saat input nama)
--   product_id    : FK ke products (cascade delete)
--   special_price : harga beli khusus karyawan (bisa di-set admin)
--   hpp_snapshot  : HPP per unit yang dipakai saat beli (untuk audit margin)
--   purchased     : true = sudah terbeli (ceklist)
--
-- Harga jual & HPP "live" di ambil dari products / product_hpp saat
-- pemakaian — tidak digandakan di sini, jadi selalu up-to-date.
--
-- Purely additive: tidak menyentuh tabel lain.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.employees (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    TEXT NOT NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (full_name)
);

CREATE TABLE IF NOT EXISTS public.employee_sales (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  special_price INTEGER NOT NULL DEFAULT 0,
  hpp_snapshot  INTEGER,
  purchased     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_sales_employee ON public.employee_sales (employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_sales_product ON public.employee_sales (product_id);

DROP TRIGGER IF EXISTS trg_employee_sales_touch_updated_at ON public.employee_sales;
CREATE TRIGGER trg_employee_sales_touch_updated_at
  BEFORE UPDATE ON public.employee_sales
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS: hanya admin (halaman memakai service role dari Next.js, bypass RLS)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employees admin read" ON public.employees;
CREATE POLICY "employees admin read"
  ON public.employees FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "employees admin write" ON public.employees;
CREATE POLICY "employees admin write"
  ON public.employees FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "employee_sales admin read" ON public.employee_sales;
CREATE POLICY "employee_sales admin read"
  ON public.employee_sales FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "employee_sales admin write" ON public.employee_sales;
CREATE POLICY "employee_sales admin write"
  ON public.employee_sales FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
