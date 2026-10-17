-- 027_transfer_proofs_bucket.sql
-- Creates the "transfer-proofs" Supabase Storage bucket so the
-- /api/payment/upload-proof route can store customer proof files
-- and the admin OrderCard can render them directly.

BEGIN;

INSERT INTO storage.buckets (id, name, public)
VALUES ('transfer-proofs', 'transfer-proofs', true)
ON CONFLICT (id) DO NOTHING;

COMMIT;
