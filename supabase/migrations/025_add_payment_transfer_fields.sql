-- 025_add_payment_transfer_fields.sql
-- Menambah dukungan pembayaran manual (transfer bank) ke tabel orders
-- dan kolom bank info di store_settings.

BEGIN;

-- Tambah kolom payment_method ke orders (transfer, midtrans, etc)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT NULL;

-- Tambah kolom bukti transfer
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS transfer_proof_url TEXT DEFAULT NULL;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS transfer_proof_filename TEXT DEFAULT NULL;

-- Seed store_settings: bank info untuk pembayaran manual
INSERT INTO public.store_settings (key, value) VALUES ('bank_name', 'BCA')
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.store_settings (key, value) VALUES ('bank_account_number', '0000000000')
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.store_settings (key, value) VALUES ('bank_account_holder', 'WALI Merch')
ON CONFLICT (key) DO NOTHING;

COMMIT;
