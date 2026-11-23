-- 031_add_products_created_at.sql
-- Tambah kolom created_at ke tabel products (belum ada di migration sebelumnya).
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Index untuk sorting
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
