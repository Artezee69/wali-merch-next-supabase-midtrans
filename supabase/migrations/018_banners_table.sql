-- ============================================================
-- 018_banners_table.sql
-- Banner management: tabel untuk hero carousel + 2 promo banner
-- (right_top & right_bottom) pada halaman home, serta storage
-- bucket untuk upload gambar banner.
-- ============================================================

-- 1) Tabel banners
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

-- Reuse trigger function from migration 007 (touch_updated_at)
DROP TRIGGER IF EXISTS trg_banners_touch_updated_at ON public.banners;
CREATE TRIGGER trg_banners_touch_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2) RLS: public read active+within window, admin full
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

-- 3) Storage bucket "banners" (public read)
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
