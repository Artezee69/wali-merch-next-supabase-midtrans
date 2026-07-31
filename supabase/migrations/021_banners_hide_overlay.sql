-- ============================================================
-- 021_banners_hide_overlay.sql
-- Tambah kolom hide_overlay untuk banner yang sudah punya teks
-- di dalam gambar (e.g. sample SVG dengan teks baked-in).
-- Ketika hide_overlay=true, frontend tidak menampilkan teks
-- overlay dari kolom title/subtitle/button_text di atas gambar.
-- ============================================================

ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS hide_overlay BOOLEAN NOT NULL DEFAULT false;