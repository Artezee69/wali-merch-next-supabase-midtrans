-- ============================================================
-- 007_extend_products_schema.sql
-- Memperluas schema produk untuk mendukung Shopee-style
-- manajemen produk: status, harga diskon, SKU, berat,
-- dimensi, has_variants, SEO, dsb. Tidak menghapus data lama.
-- ============================================================

-- 1) Tambahkan kolom ke products (idempotent)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft','active','inactive','archived')),
  ADD COLUMN IF NOT EXISTS base_price INTEGER,
  ADD COLUMN IF NOT EXISTS sale_price INTEGER,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS weight INTEGER,            -- dalam gram
  ADD COLUMN IF NOT EXISTS length INTEGER,            -- cm
  ADD COLUMN IF NOT EXISTS width INTEGER,             -- cm
  ADD COLUMN IF NOT EXISTS height INTEGER,            -- cm
  ADD COLUMN IF NOT EXISTS has_variants BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_new BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_purchase INTEGER NOT NULL DEFAULT 1
    CHECK (min_purchase >= 1),
  ADD COLUMN IF NOT EXISTS max_purchase INTEGER NOT NULL DEFAULT 99
    CHECK (max_purchase >= 1),
  ADD COLUMN IF NOT EXISTS condition TEXT NOT NULL DEFAULT 'new'
    CHECK (condition IN ('new','used','refurbished')),
  ADD COLUMN IF NOT EXISTS subcategory TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preorder_processing_days INTEGER,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2) Backfill base_price dari price untuk row lama
UPDATE public.products
  SET base_price = price
  WHERE base_price IS NULL AND price IS NOT NULL;

-- 3) Perbarui updated_at lewat trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_touch_updated_at ON public.products;
CREATE TRIGGER trg_products_touch_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4) Tambahkan kolom ke product_images
ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_product_images_touch_updated_at ON public.product_images;
CREATE TRIGGER trg_product_images_touch_updated_at
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Pastikan satu produk hanya punya satu primary image
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_images_primary
  ON public.product_images (product_id)
  WHERE is_primary = true;

-- 5) Tambahkan kolom ke product_variants
-- CATATAN: kolom size & color sudah ada; kita tambahkan field tambahan
-- tanpa menghapus kolom lama agar AddToCart lama tidak rusak.
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS option_1_name TEXT DEFAULT 'Color',
  ADD COLUMN IF NOT EXISTS option_1_value TEXT,
  ADD COLUMN IF NOT EXISTS option_2_name TEXT DEFAULT 'Size',
  ADD COLUMN IF NOT EXISTS option_2_value TEXT,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS price INTEGER,
  ADD COLUMN IF NOT EXISTS sale_price INTEGER,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weight INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill: salin size/color ke option_1/2 untuk data lama
UPDATE public.product_variants
  SET option_1_value = color
  WHERE option_1_value IS NULL AND color IS NOT NULL;

UPDATE public.product_variants
  SET option_2_value = size
  WHERE option_2_value IS NULL AND size IS NOT NULL;

DROP TRIGGER IF EXISTS trg_product_variants_touch_updated_at ON public.product_variants;
CREATE TRIGGER trg_product_variants_touch_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Unique SKU per produk
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_variants_sku_per_product
  ON public.product_variants (product_id, sku)
  WHERE sku IS NOT NULL;

-- Unique kombinasi option per produk
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_variants_options
  ON public.product_variants (product_id, option_1_value, option_2_value)
  WHERE option_1_value IS NOT NULL AND option_2_value IS NOT NULL;

-- 6) Index untuk pencarian & filter
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON public.products(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort ON public.product_images(product_id, sort_order);
