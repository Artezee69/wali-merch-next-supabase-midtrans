-- ============================================================
-- 030_banners_focus_point.sql
-- Tambah kolom focus_point untuk kontrol object-position banner
-- agar admin bisa atau ke mana gambar difokuskan (tidak kepotong
-- di bagian penting).
-- ============================================================

ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS focus_point TEXT NOT NULL DEFAULT 'center'
  CHECK (focus_point IN ('center','top','bottom','left','right','top-left','top-right','bottom-left','bottom-right'));

-- Update RLS untuk admin write
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
