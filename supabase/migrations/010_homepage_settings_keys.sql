-- ============================================================
-- 010_homepage_settings_keys.sql
-- Seeds new JSON-blob keys used by the extended /admin/settings UI.
-- Tabel `public.store_settings` sudah ada (dari 008) dan dipakai
-- dengan pola key-value. Migration ini TIDAK membuat tabel baru.
--
-- Keys ditambahkan (semua JSON string):
--   - homepage_header        : { logoUrl, logoText, logoSubtitle, ... }
--   - homepage_hero          : { badgeLeft, headlineTop, ..., backgroundType }
--   - homepage_stats         : HomepageStat[]
--   - homepage_trust_badges  : TrustBadge[]
--   - homepage_latest_drop   : { title, description, mode, manualProductIds, ... }
--   - homepage_sections      : { marquee, whyWali, howToOrder, cta, faq }
--   - homepage_footer        : { logoUrl, brandDescription, links, social, ... }
--   - homepage_seo           : { metaTitle, metaDescription, ogTitle, ... }
--
-- ON CONFLICT DO NOTHING — admin dapat mengedit nilainya tanpa
-- ditimpa saat migration dijalankan ulang.
-- ============================================================

INSERT INTO public.store_settings (key, value) VALUES
  ('homepage_header',        NULL),
  ('homepage_hero',          NULL),
  ('homepage_stats',         NULL),
  ('homepage_trust_badges',  NULL),
  ('homepage_latest_drop',   NULL),
  ('homepage_sections',      NULL),
  ('homepage_footer',        NULL),
  ('homepage_seo',           NULL)
ON CONFLICT (key) DO NOTHING;
