-- ============================================================
-- 020_seed_real_banners.sql
-- Replace seeded banners with real SVG samples (Neon Stage style).
-- Image URLs point to /banners/*.svg served from public/.
-- hide_overlay=true karena teks sudah baked-in ke dalam SVG.
-- ============================================================

-- Hapus data placeholder (aman — ini cuma development seed)
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