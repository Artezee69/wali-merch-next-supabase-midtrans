-- 024_add_stock_column_to_products.sql
-- Menambahkan kolom stock ke tabel products untuk produk non-varian.
-- Produk dengan varian sudah menggunakan product_variants.stock.

BEGIN;

-- Tambah kolom stock (nullable, default 0)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;

-- Isi stock untuk produk non-variant yang belum punya
UPDATE public.products
SET stock = COALESCE(
  (SELECT SUM(v.stock)
   FROM public.product_variants v
   WHERE v.product_id = products.id
     AND v.is_active = true),
  0
)
WHERE has_variants = false AND (stock IS NULL OR stock = 0);

-- Migrate existing products: untuk yang punya variants, sync dari variants
UPDATE public.products p
SET stock = sub.total_stock
FROM (
  SELECT product_id, SUM(stock) AS total_stock
  FROM public.product_variants
  WHERE is_active = true
  GROUP BY product_id
) sub
WHERE p.id = sub.product_id
  AND p.has_variants = true;

COMMIT;
