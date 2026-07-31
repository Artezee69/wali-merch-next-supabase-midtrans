-- ============================================================
-- 019_seed_banners.sql
-- Contoh data banner untuk development.
-- Catatan: image_url masih placeholder. Silakan upload gambar
-- asli via /admin/banners setelah deploy.
-- ============================================================

INSERT INTO public.banners
  (title, subtitle, image_url, storage_path, button_text, button_link, position, sort_order, status)
VALUES
  -- Hero carousel (multiple, diurut ascending)
  ('Drop Eksklusif 2026',
   'Koleksi terbaru yang siap melengkapi gaya kamu.',
   'https://placehold.co/1600x600/0b0b0b/d7ff53?text=Hero+1',
   'seed/hero-1.svg',
   'Lihat Koleksi',
   '/products',
   'hero', 1, true),

  ('Limited Edition',
   'Stok terbatas, jangan sampai kehabisan.',
   'https://placehold.co/1600x600/0b0b0b/d7ff53?text=Hero+2',
   'seed/hero-2.svg',
   'Belanja Sekarang',
   '/products',
   'hero', 2, true),

  ('Free Ongkir Jawa-Bali',
   'Spesial promo bulan ini untuk wilayah tertentu.',
   'https://placehold.co/1600x600/0b0b0b/d7ff53?text=Hero+3',
   'seed/hero-3.svg',
   'Lihat Promo',
   '/products',
   'hero', 3, true),

  -- Promo kanan atas
  ('Promo Spesial',
   NULL,
   'https://placehold.co/600x300/0b0b0b/d7ff53?text=Promo+Top',
   'seed/promo-top.svg',
   'Lihat',
   '/products',
   'right_top', 1, true),

  -- Promo kanan bawah
  ('Flash Sale',
   NULL,
   'https://placehold.co/600x300/0b0b0b/d7ff53?text=Promo+Bottom',
   'seed/promo-bottom.svg',
   'Lihat',
   '/products',
   'right_bottom', 1, true)
ON CONFLICT DO NOTHING;