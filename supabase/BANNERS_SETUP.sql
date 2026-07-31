-- ============================================================
-- BANNERS_SETUP.sql
-- Konsolidasi: migration 018 (table) + 020 (seed real) + 021 (hide_overlay).
-- Cara pakai: buka Supabase Dashboard → SQL Editor → New query →
-- paste file ini → Run.
-- ============================================================

-- ============================================================
-- BAGIAN 1: Tabel banners + indexes + RLS + storage bucket
-- (dari migration 018_banners_table.sql)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.banners (
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  subtitle     TEXT,
  image_url    TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  button_text  TEXT,
  button_link  TEXT,
  position     TEXT NOT NULL
                 CHECK (position IN ('hero','right_top','right_bottom')),
  sort_order   INTEGER NOT NULL DEFAULT 0,
  status       BOOLEAN NOT NULL DEFAULT true,
  start_date   TIMESTAMPTZ,
  end_date     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banners_position
  ON public.banners(position);
CREATE INDEX IF NOT EXISTS idx_banners_status
  ON public.banners(status);
CREATE INDEX IF NOT EXISTS idx_banners_active_window
  ON public.banners(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_banners_position_sort
  ON public.banners(position, sort_order, status);

-- Trigger touch updated_at (reuse function dari migration 007)
DROP TRIGGER IF EXISTS trg_banners_touch_updated_at ON public.banners;
CREATE TRIGGER trg_banners_touch_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banners public read active" ON public.banners;
CREATE POLICY "banners public read active"
  ON public.banners FOR SELECT
  USING (
    status = true
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  );

DROP POLICY IF EXISTS "banners admin read" ON public.banners;
CREATE POLICY "banners admin read"
  ON public.banners FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "banners admin write" ON public.banners;
CREATE POLICY "banners admin write"
  ON public.banners FOR ALL
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

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "banners storage public read" ON storage.objects;
CREATE POLICY "banners storage public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "banners storage admin write" ON storage.objects;
CREATE POLICY "banners storage admin write"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'banners'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'banners'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- BAGIAN 2: Tambah kolom hide_overlay
-- (dari migration 021_banners_hide_overlay.sql)
-- ============================================================

ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS hide_overlay BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- BAGIAN 3: Replace data dengan banner sample SVG (Neon Stage style)
-- (dari migration 020_seed_real_banners.sql)
-- ============================================================

TRUNCATE TABLE public.banners RESTART IDENTITY;

INSERT INTO public.banners
  (title, subtitle, image_url, storage_path, button_text, button_link, position, sort_order, status, start_date, end_date, hide_overlay)
VALUES
  -- Hero 1: Drop Eksklusif
  ('Drop Eksklusif 2026',
   'Koleksi terbaru yang siap melengkapi gaya kamu di atas panggung.',
   '/banners/hero-1.svg',
   'public/banners/hero-1.svg',
   'Lihat Koleksi',
   '/products',
   'hero', 1, true, NULL, NULL, true),

  -- Hero 2: Limited Edition
  ('Limited Edition',
   'Stok terbatas. Hanya untuk yang tercepat — jangan sampai kehabisan.',
   '/banners/hero-2.svg',
   'public/banners/hero-2.svg',
   'Belanja Sekarang',
   '/products',
   'hero', 2, true, NULL, NULL, true),

  -- Promo kanan atas: Flash Sale
  ('Flash Sale 50% Off',
   'Hanya untuk waktu terbatas. Buruan checkout!',
   '/banners/promo-top.svg',
   'public/banners/promo-top.svg',
   'Ambil Promo',
   '/products',
   'right_top', 1, true, NULL, NULL, true),

  -- Promo kanan bawah: New Arrival
  ('T-Shirt Player Edition',
   'T-shirt official WALI. Bahan premium, jahitan rapi, limited stock.',
   '/banners/promo-bottom.svg',
   'public/banners/promo-bottom.svg',
   'Shop Now',
   '/products',
   'right_bottom', 1, true, NULL, NULL, true)
;

-- Verifikasi
SELECT position, sort_order, title, image_url, hide_overlay
FROM public.banners
ORDER BY position, sort_order;