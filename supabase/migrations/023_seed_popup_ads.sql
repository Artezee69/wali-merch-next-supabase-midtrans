-- ============================================
-- SEED: Contoh Popup Ads — Gambar dari File Lokal
-- ============================================
-- Taruh gambar di: public/popup/banner-1.jpg, banner-2.jpg, banner-3.jpg
-- ============================================

INSERT INTO public.popup_ads (
  title, subtitle, body,
  image_url, storage_path,
  button_text, button_link,
  position, status,
  start_date, end_date,
  dismiss_minutes, sort_order, audience
) VALUES (
  '🎉 Diskon 30% Member!',
  'Promo spesial untuk member setia WALI Merch',
  'Nikmati diskon 30% untuk semua koleksi terbaru. Gunakan kode: MEMBER30',
  '/popup/banner-1.jpg',
  'popup/banner-1.jpg',
  'Belanja Sekarang',
  '/products',
  'center',
  true,
  NOW() - INTERVAL '1 day',
  NULL,
  60,
  1,
  'logged_in'
), (
  '🚀 Koleksi Terbaru Sudah Hadir!',
  NULL,
  'Lihat drop terbaru dari WALI Merch — Player Edition Series. Stok terbatas!',
  '/popup/banner-2.jpg',
  'popup/banner-2.jpg',
  'Lihat Koleksi',
  '/products',
  'bottom_right',
  true,
  NOW() - INTERVAL '1 day',
  NULL,
  1440,
  2,
  'all'
), (
  '🎵 WALI Live On Tour 2025',
  'Jangan lewatkan konser paling panas tahun ini!',
  'Tiket masih tersedia dengan harga spesial early bird. Klik sekarang sebelum kehabisan!',
  '/popup/banner-3.jpg',
  'popup/banner-3.jpg',
  'Beli Tiket',
  '/products?category=tour',
  'center',
  true,
  NOW() - INTERVAL '1 day',
  NULL,
  1440,
  3,
  'logged_in'
);

SELECT id, title, position, audience, status FROM public.popup_ads ORDER BY sort_order;
