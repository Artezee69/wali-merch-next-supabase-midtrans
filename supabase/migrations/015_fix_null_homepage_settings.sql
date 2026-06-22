-- ============================================================
-- 015_fix_null_homepage_settings.sql
-- Isi value NULL di store_settings untuk homepage_* keys.
--
-- Latar belakang:
--   - Migration 010 insert row dengan key homepage_* tapi value=NULL
--   - Migration 013 (atau 010_seeds) pakai INSERT ON CONFLICT DO NOTHING
--     → skip kalau key udah ada → value tetep NULL
--   - `readJsonRow()` di lib/storeSettings.ts baca NULL → fallback → warning
--
-- Solusi: UPDATE row yang value-nya NULL, jangan INSERT baru.
-- Aman dijalankan ulang (idempotent).
-- ============================================================

-- Fix homepage_header
UPDATE public.store_settings SET value = $hj$
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
$hj$ WHERE key = 'homepage_header' AND (value IS NULL);

-- Fix homepage_hero
UPDATE public.store_settings SET value = $ho$
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
$ho$ WHERE key = 'homepage_hero' AND (value IS NULL);

-- Fix homepage_stats
UPDATE public.store_settings SET value = $st$
[
  { "id": "stat-pieces", "value": "2.400+", "label": "PIECES SHIPPED" },
  { "id": "stat-official", "value": "100%", "label": "OFFICIAL" },
  { "id": "stat-process", "value": "1–2d", "label": "PROCESS" }
]
$st$ WHERE key = 'homepage_stats' AND (value IS NULL);

-- Fix homepage_trust_badges
UPDATE public.store_settings SET value = $tb$
[
  { "id": "badge-warranty", "text": "Garansi resmi", "icon": "shield", "enabled": true },
  { "id": "badge-midtrans", "text": "Midtrans secured checkout", "icon": "lock", "enabled": true },
  { "id": "badge-limited", "text": "Limited capsule", "icon": "sparkles", "enabled": true }
]
$tb$ WHERE key = 'homepage_trust_badges' AND (value IS NULL);

-- Fix homepage_latest_drop
UPDATE public.store_settings SET value = $ld$
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
$ld$ WHERE key = 'homepage_latest_drop' AND (value IS NULL);

-- Fix homepage_sections
UPDATE public.store_settings SET value = $sc$
{
  "marquee": true,
  "whyWali": true,
  "howToOrder": true,
  "cta": true,
  "faq": true
}
$sc$ WHERE key = 'homepage_sections' AND (value IS NULL);

-- Fix homepage_marquee
UPDATE public.store_settings SET value = $mq$
{
  "enabled": true,
  "texts": ["OFFICIAL DROP", "LIMITED CAPSULE", "STAGE READY", "NEW SS/26"]
}
$mq$ WHERE key = 'homepage_marquee' AND (value IS NULL);

-- Fix homepage_why_wali
UPDATE public.store_settings SET value = $ww$
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
$ww$ WHERE key = 'homepage_why_wali' AND (value IS NULL);

-- Fix homepage_how_to_order
UPDATE public.store_settings SET value = $hto$
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
$hto$ WHERE key = 'homepage_how_to_order' AND (value IS NULL);

-- Fix homepage_cta
UPDATE public.store_settings SET value = $ct$
{
  "enabled": true,
  "title": "Siap naik panggung?",
  "description": "Checkout sekarang, atau track pesananmu yang sudah jalan.",
  "primaryLabel": "Shop Collection",
  "primaryUrl": "/products",
  "secondaryLabel": "Track Order",
  "secondaryUrl": "/track-order"
}
$ct$ WHERE key = 'homepage_cta' AND (value IS NULL);

-- Fix homepage_faq
UPDATE public.store_settings SET value = $fq$
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
$fq$ WHERE key = 'homepage_faq' AND (value IS NULL);

-- Fix homepage_footer
UPDATE public.store_settings SET value = $ft$
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
$ft$ WHERE key = 'homepage_footer' AND (value IS NULL);

-- Fix homepage_seo
UPDATE public.store_settings SET value = $so$
{
  "metaTitle": "WALI Official Merchandise — Apparel Panggung",
  "metaDescription": "WALI Merch — apparel resmi untuk panggung. Limited capsule, material premium, checkout aman via Midtrans.",
  "ogTitle": "WALI Official Merchandise",
  "ogDescription": "Apparel resmi WALI. Edisi terbatas, dibuat untuk panggung.",
  "ogImage": ""
}
$so$ WHERE key = 'homepage_seo' AND (value IS NULL);
