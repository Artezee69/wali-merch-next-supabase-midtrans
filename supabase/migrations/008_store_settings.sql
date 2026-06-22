-- ============================================================
-- 008_store_settings.sql
-- Memastikan tabel `public.store_settings` ada di database.
--
-- Latar belakang:
--   - `lib/storeSettings.ts` (getStoreSettings) membaca dari tabel
--     `public.store_settings` dengan kolom `key` (text PK) dan `value`
--     (text) plus metadata `updated_at` / `updated_by`.
--   - Migration 006 seharusnya membuat tabel ini, namun environment
--     remote/production belum menerapkannya sehingga PostgREST
--     mengembalikan error "Could not find the table 'public.store_settings'
--     in the schema cache".
--   - File ini idempotent: aman dijalankan berulang. Ia juga memastikan
--     fungsi `public.is_admin()` ada (bergantung pada policies RLS).
--
-- Tabel ini menyimpan key-value string untuk pengaturan toko yang
-- aman diubah dari antarmuka admin. Penulisan hanya boleh lewat
-- service-role/admin client; pelanggan tidak boleh menulis dari
-- browser.
-- ============================================================

-- 1) Pastikan helper is_admin() tersedia (dari 006).
--    CREATE OR REPLACE aman: jika sudah ada dari 006, definisi tetap
--    sama persis; jika belum ada, kita buat agar policy RLS valid.
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

-- 2) Buat tabel store_settings (idempotent).
--    Struktur sesuai dengan yang dipakai kode:
--      - key  TEXT PRIMARY KEY (dipakai sebagai identifier setting)
--      - value TEXT (semua nilai disimpan sebagai string; low_stock_threshold
--        di-cast ke number di sisi aplikasi)
--      - updated_at TIMESTAMPTZ (audit timestamp)
--      - updated_by UUID (FK ke profiles; nullable agar insert default
--        tidak gagal sebelum ada admin)
CREATE TABLE IF NOT EXISTS public.store_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 3) Aktifkan RLS + policy yang sama dengan 006.
--    Policy ini memastikan:
--      - SELECT: hanya admin (auth + service-role bypass RLS otomatis)
--      - INSERT/UPDATE/DELETE: ditolak untuk client (server-only writes)
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

-- 4) Seed default values yang dipakai `lib/storeSettings.ts` (DEFAULT_SETTINGS).
--    Daftar ini mencakup semua key yang dibaca `getStoreSettings()`:
--      store_name, store_whatsapp, store_email, store_address,
--      low_stock_threshold, privacy_policy, terms_of_service.
--    ON CONFLICT (key) DO NOTHING — aman dijalankan berulang dan
--    tidak menimpa nilai yang sudah diatur admin.
INSERT INTO public.store_settings (key, value) VALUES
  ('store_name',          'WALI Merch'),
  ('store_whatsapp',      ''),
  ('store_email',         ''),
  ('store_address',       ''),
  ('low_stock_threshold', '5'),
  ('privacy_policy',      ''),
  ('terms_of_service',    '')
ON CONFLICT (key) DO NOTHING;

-- 5) Touch updated_at saat baris di-upsert.
--    Trigger ini tidak dibuat di 006; kita tambahkan agar
--    konsistensi dengan tabel products/product_variants dari 007.
CREATE OR REPLACE FUNCTION public.touch_store_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_store_settings_touch_updated_at ON public.store_settings;
CREATE TRIGGER trg_store_settings_touch_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_store_settings_updated_at();
