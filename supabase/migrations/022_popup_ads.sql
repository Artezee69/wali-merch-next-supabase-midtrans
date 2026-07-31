-- ============================================================
-- 022_popup_ads.sql
-- Popup ads yang muncul untuk user yang sudah login.
-- Admin bisa mengaktifkan/menonaktifkan dan mengedit
-- judul, isi, gambar, tombol CTA, dan jadwal tampil.
-- ============================================================

-- 1) Tabel popup_ads (bisa banyak popup aktif)
CREATE TABLE IF NOT EXISTS public.popup_ads (
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  subtitle     TEXT,
  body         TEXT,
  image_url    TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  button_text  TEXT,
  button_link  TEXT,
  -- posisi popup: 'center' = modal overlay di tengah, 'bottom_right' = card kecil pojok
  position     TEXT NOT NULL DEFAULT 'center'
                 CHECK (position IN ('center','bottom_right')),
  status       BOOLEAN NOT NULL DEFAULT true,
  -- jadwal tampil opsional
  start_date   TIMESTAMPTZ,
  end_date     TIMESTAMPTZ,
  -- cookie dismiss TTL dalam menit (berapa lama user tidak melihat popup ini setelah menutup)
  dismiss_minutes INTEGER NOT NULL DEFAULT 60,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  -- target audience: 'all' untuk semua, 'logged_in' khusus user login
  audience     TEXT NOT NULL DEFAULT 'logged_in'
                 CHECK (audience IN ('all','logged_in','guest')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_popup_ads_status
  ON public.popup_ads(status);
CREATE INDEX IF NOT EXISTS idx_popup_ads_audience
  ON public.popup_ads(audience);
CREATE INDEX IF NOT EXISTS idx_popup_ads_active_window
  ON public.popup_ads(start_date, end_date);

DROP TRIGGER IF EXISTS trg_popup_ads_touch_updated_at ON public.popup_ads;
CREATE TRIGGER trg_popup_ads_touch_updated_at
  BEFORE UPDATE ON public.popup_ads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2) RLS
ALTER TABLE public.popup_ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "popup_ads public read active" ON public.popup_ads;
CREATE POLICY "popup_ads public read active"
  ON public.popup_ads FOR SELECT
  USING (
    status = true
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  );

DROP POLICY IF EXISTS "popup_ads admin read" ON public.popup_ads;
CREATE POLICY "popup_ads admin read"
  ON public.popup_ads FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "popup_ads admin write" ON public.popup_ads;
CREATE POLICY "popup_ads admin write"
  ON public.popup_ads FOR ALL
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

-- 3) Storage bucket "popup-ads" (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('popup-ads', 'popup-ads', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "popup_ads storage public read" ON storage.objects;
CREATE POLICY "popup_ads storage public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'popup-ads');

DROP POLICY IF EXISTS "popup_ads storage admin write" ON storage.objects;
CREATE POLICY "popup_ads storage admin write"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'popup-ads'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'popup-ads'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );