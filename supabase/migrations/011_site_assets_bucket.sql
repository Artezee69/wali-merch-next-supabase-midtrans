-- ============================================================
-- 011_site_assets_bucket.sql
-- Membuat bucket Supabase Storage "site-assets" + RLS policies
-- agar admin panel bisa upload gambar (logo, background, dll).
--
-- Folder yang dipakai:
--   logo/           — logo header & footer
--   backgrounds/    — hero background images
--   seo/            — Open Graph images
--   misc/           — gambar lain
-- ============================================================

-- 2) Buat bucket "site-assets" (public, untuk gambar hero/logo/SEO).
--    Insert langsung ke tabel buckets karena fungsi create_bucket belum tersedia.
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true);

-- 3) Aktifkan RLS di tabel objects.
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4) Policy: semua user terautentikasi bisa baca (public bucket).
DROP POLICY IF EXISTS "site-assets public read" ON storage.objects;
CREATE POLICY "site-assets public read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'site-assets');

-- 5) Policy: hanya admin yang bisa upload/update/hapus.
--    Kita cek role dari profiles table.
DROP POLICY IF EXISTS "site-assets admin write" ON storage.objects;
CREATE POLICY "site-assets admin write" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'site-assets'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
