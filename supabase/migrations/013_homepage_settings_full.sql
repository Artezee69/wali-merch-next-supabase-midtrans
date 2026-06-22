-- ============================================================
-- 013_homepage_settings_full.sql
-- Idempotent consolidation: ensures ALL homepage settings keys
-- exist in public.store_settings with valid default JSON.
--
-- Latar belakang:
--   - 010_homepage_settings_keys.sql   : seeds key=NULL rows
--   - 010_homepage_settings_seeds.sql  : fills in default JSON
--   - 010_home_content.sql             : separate home_content table
--   - File 010 dipecah jadi 3 dan
--     belum tentu ke-apply berurutan di production DB.
--   - Logs Vercel menunjukkan:
--       readJsonRow(homepage_sections) no row found
--       readJsonRow(homepage_seo)      no row found
--       readJsonRow(homepage_latest_drop) no row found
--     artinya keys ini tidak ada di production.
--
-- Strategi: INSERT ... ON CONFLICT (key) DO NOTHING untuk tiap
-- key. Tidak menimpa nilai yang sudah diatur admin. Aman
-- dijalankan berulang.
-- ============================================================

-- 1) Header
INSERT INTO public.store_settings (key, value) VALUES
  ('homepage_header', $hj$
{
  "logoUrl": "",
  "logoText": "WALI",
  "logoSubtitle": "OFFICIAL MERCHANDISE",
  "showSubtitle": true,
  "menuLabels": {
    "home": "Home",
    "products": "Products",
    "trackOrder": "Track Order",
    "cart": "Cart"
  },
  "loginLabel": "Login",
  "registerLabel": "Daftar",
  "showLogin": true,
  "showRegister": true
}
$hj$)
ON CONFLICT (key) DO NOTHING;

-- 2) Hero
INSERT INTO public.store_settings (key, value) VALUES
  ('homepage_hero', $ho$
{
  "enabled": true,
  "badge": "Live · Drop 2026 Active",
  "badgeLeft": "Live · Drop 2026 Active",
  "badgeRight": "JKT",
  "headlineTop": "Wear The",
  "headlineHighlight": "Stage",
  "headlineBottom": "Energy",
  "description": "Apparel resmi untuk panggung. Limited capsule, material premium, checkout aman via Midtrans.",
  "primaryCtaLabel": "Shop Collection",
  "primaryCtaUrl": "/products",
  "secondaryCtaLabel": "Track Order",
  "secondaryCtaUrl": "/track-order",
  "primaryButtonText": "Shop Collection",
  "primaryButtonUrl": "/products",
  "secondaryButtonText": "Track Order",
  "secondaryButtonUrl": "/track-order",
  "backgroundType": "gradient",
  "backgroundColor": "#0b0b0b",
  "backgroundImage": "",
  "backgroundImageUrl": "",
  "backgroundGradient": "",
  "overlayOpacity": 40,
  "backgroundOpacity": 0.4
}
$ho$)
ON CONFLICT (key) DO NOTHING;

-- 3) Stats
INSERT INTO public.store_settings (key, value) VALUES
  ('homepage_stats', $st$
[
  { "id": "stat-pieces", "value": "2.400+", "label": "PIECES SHIPPED" },
  { "id": "stat-official", "value": "100%", "label": "OFFICIAL" },
  { "id": "stat-process", "value": "1–2d", "label": "PROCESS" }
]
$st$)
ON CONFLICT (key) DO NOTHING;

-- 4) Trust badges
INSERT INTO public.store_settings (key, value) VALUES
  ('homepage_trust_badges', $tb$
[
  { "id": "badge-warranty", "text": "Garansi resmi", "icon": "shield", "enabled": true },
  { "id": "badge-midtrans", "text": "Midtrans secured checkout", "icon": "lock", "enabled": true },
  { "id": "badge-limited", "text": "Limited capsule", "icon": "sparkles", "enabled": true }
]
$tb$)
ON CONFLICT (key) DO NOTHING;

-- 5) Latest drop
INSERT INTO public.store_settings (key, value) VALUES
  ('homepage_latest_drop', $ld$
{
  "enabled": true,
  "title": "Latest Drop",
  "description": "Pieces paling baru dari WALI.",
  "ctaLabel": "Lihat semua",
  "ctaUrl": "/products",
  "limit": 6,
  "backgroundColor": "#0b0b0b",
  "mode": "auto",
  "manualProductIds": []
}
$ld$)
ON CONFLICT (key) DO NOTHING;

-- 6) Section toggles
INSERT INTO public.store_settings (key, value) VALUES
  ('homepage_sections', $sc$
{
  "marquee": true,
  "whyWali": true,
  "howToOrder": true,
  "cta": true,
  "faq": true
}
$sc$)
ON CONFLICT (key) DO NOTHING;

-- 7) Per-section content (jika key ini dipakai)
INSERT INTO public.store_settings (key, value) VALUES
  ('homepage_marquee', $mq$
{
  "enabled": true,
  "texts": ["OFFICIAL DROP", "LIMITED CAPSULE", "STAGE READY", "NEW SS/26"]
}
$mq$)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.store_settings (key, value) VALUES
  ('homepage_why_wali', $ww$
{
  "enabled": true,
  "title": "Why WALI",
  "description": "Setiap piece dibuat dengan detail panggung — dari fit, material, sampai kontrol kualitas.",
  "items": [
    { "id": "ww-1", "title": "Official Merch", "description": "Garansi resmi merch WALI.", "icon": "shield" },
    { "id": "ww-2", "title": "Limited Capsule", "description": "Editions terbatas, sekali jalan.", "icon": "flame" },
    { "id": "ww-3", "title": "Stage-grade Material", "description": "Material yang sama dipakai di panggung.", "icon": "sparkles" },
    { "id": "ww-4", "title": "Midtrans Secured", "description": "Checkout aman via Midtrans.", "icon": "lock" }
  ]
}
$ww$)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.store_settings (key, value) VALUES
  ('homepage_how_to_order', $hto$
{
  "enabled": true,
  "title": "How to Order",
  "description": "Empat langkah mudah dari checkout sampai di panggungmu.",
  "steps": [
    { "id": "hto-1", "step": "01", "title": "Pilih item", "description": "Browse koleksi dan pilih ukuran favoritmu." },
    { "id": "hto-2", "step": "02", "title": "Checkout", "description": "Isi alamat dan pilih pembayaran via Midtrans." },
    { "id": "hto-3", "step": "03", "title": "Diproses", "description": "Pesanan diproses dalam 1–2 hari kerja." },
    { "id": "hto-4", "step": "04", "title": "Dikirim", "description": "Resi otomatis masuk dan bisa di-track." }
  ]
}
$hto$)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.store_settings (key, value) VALUES
  ('homepage_cta', $ct$
{
  "enabled": true,
  "title": "Siap naik panggung?",
  "description": "Checkout sekarang, atau track pesananmu yang sudah jalan.",
  "primaryLabel": "Shop Collection",
  "primaryUrl": "/products",
  "secondaryLabel": "Track Order",
  "secondaryUrl": "/track-order"
}
$ct$)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.store_settings (key, value) VALUES
  ('homepage_faq', $fq$
{
  "enabled": true,
  "title": "FAQ",
  "description": "Pertanyaan yang sering ditanyakan customer WALI.",
  "items": [
    { "id": "faq-1", "question": "Berapa lama pesanan diproses?", "answer": "1–2 hari kerja setelah pembayaran berhasil." },
    { "id": "faq-2", "question": "Apakah ada garansi?", "answer": "Ya, semua item official merch bergaransi resmi." },
    { "id": "faq-3", "question": "Bagaimana cara track pesanan?", "answer": "Gunakan menu Track Order dengan nomor order dan email." }
  ]
}
$fq$)
ON CONFLICT (key) DO NOTHING;

-- 8) Footer
INSERT INTO public.store_settings (key, value) VALUES
  ('homepage_footer', $ft$
{
  "logoUrl": "",
  "logoText": "WALI",
  "brandDescription": "Official merchandise untuk komunitas panggung. Limited capsule, dibuat dengan material premium.",
  "address": "",
  "email": "",
  "whatsapp": "",
  "instagram": "",
  "tiktok": "",
  "youtube": "",
  "copyrightText": "© {year} WALI Merch. All rights reserved.",
  "links": [
    { "id": "link-products", "label": "Products", "url": "/products" },
    { "id": "link-track", "label": "Track Order", "url": "/track-order" },
    { "id": "link-faq", "label": "FAQ", "url": "/faq" }
  ]
}
$ft$)
ON CONFLICT (key) DO NOTHING;

-- 9) SEO
INSERT INTO public.store_settings (key, value) VALUES
  ('homepage_seo', $so$
{
  "metaTitle": "WALI Official Merchandise — Apparel Panggung",
  "metaDescription": "WALI Merch — apparel resmi untuk panggung. Limited capsule, material premium, checkout aman via Midtrans.",
  "ogTitle": "WALI Official Merchandise",
  "ogDescription": "Apparel resmi WALI. Edisi terbatas, dibuat untuk panggung.",
  "ogImage": ""
}
$so$)
ON CONFLICT (key) DO NOTHING;
