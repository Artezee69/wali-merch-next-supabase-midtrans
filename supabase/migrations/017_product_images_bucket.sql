-- ============================================================
-- 017_product_images_bucket.sql
-- Membuat bucket Supabase Storage "product-images" + RLS policies
-- agar admin panel bisa upload foto produk dan foto tampil di
-- katalog publik.
--
-- Folder yang dipakai di dalam bucket:
--   products/        — foto produk individual (nama file random UUID)
-- ============================================================

-- 1) Buat bucket "product-images" (public, agar URL foto bisa dipakai
--    langsung di <img src> tanpa signed URL).
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2) Aktifkan RLS di storage.objects (idempotent).
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3) Policy: semua orang (termasuk anonymous) bisa baca foto produk
--    dari bucket ini karena bucket-nya public.
DROP POLICY IF EXISTS "product images public read" ON storage.objects;
CREATE POLICY "product images public read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

-- 4) Policy: hanya admin yang bisa upload/update/hapus foto produk.
DROP POLICY IF EXISTS "product images admin write" ON storage.objects;
CREATE POLICY "product images admin write" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );