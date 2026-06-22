-- ============================================================
-- 012_admin_audit_log_full.sql
-- Ensure `public.admin_audit_log` exists with every column
-- referenced by `lib/adminAudit.ts`.
--
-- Latar belakang:
--   - 006 membuat tabel dengan kolom: id, actor_id, action,
--     entity, entity_id, before, after, metadata, created_at.
--   - Kode di `lib/adminAudit.ts` menulis kolom tambahan:
--       actor_email (untuk auth.login_failed tanpa user yang ter-resolve)
--       before_data / after_data (bukan `before` / `after`)
--   - Production DB terlanjur lagging — tabel bisa sama sekali
--     tidak ada, atau ada dengan kolom yang tidak lengkap.
--   - 009 hanya melonggarkan `actor_id` ke NULL — tidak menyentuh
--     kolom tambahan yang dipakai kode modern.
--
-- Strategi: idempotent, jalankan ulang tanpa efek samping.
--   - CREATE TABLE IF NOT EXISTS dengan semua kolom yang dipakai kode
--   - ALTER TABLE ADD COLUMN IF NOT EXISTS untuk kolom yang mungkin hilang
--   - Indexes: hanya dibuat jika belum ada
--   - RLS: diaktifkan dan policy "no client access" dipasang ulang
-- ============================================================

-- 1) Pastikan tabel ada dengan semua kolom yang dibutuhkan.
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  before_data JSONB,
  after_data JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Tambahkan kolom yang mungkin hilang dari instalasi lama
--    (CREATE TABLE IF NOT EXISTS di atas hanya jalan jika tabel
--    belum ada — instalasi yang sudah ada tapi kolomnya kurang
--    perlu ALTER ADD COLUMN IF NOT EXISTS).
ALTER TABLE public.admin_audit_log
  ADD COLUMN IF NOT EXISTS actor_email TEXT;

ALTER TABLE public.admin_audit_log
  ADD COLUMN IF NOT EXISTS before_data JSONB;

ALTER TABLE public.admin_audit_log
  ADD COLUMN IF NOT EXISTS after_data JSONB;

ALTER TABLE public.admin_audit_log
  ADD COLUMN IF NOT EXISTS metadata JSONB;

ALTER TABLE public.admin_audit_log
  ADD COLUMN IF NOT EXISTS entity_id TEXT;

ALTER TABLE public.admin_audit_log
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 3) actor_id dibuat nullable (untuk event auth.login_failed
--    di mana attacker tidak beresolus menjadi user yang dikenal).
--    009 sudah menangani ini, tapi pasang ulang idempotent
--    sebagai safety net.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'admin_audit_log'
      AND column_name  = 'actor_id'
      AND is_nullable  = 'NO'
  ) THEN
    ALTER TABLE public.admin_audit_log
      ALTER COLUMN actor_id DROP NOT NULL;
  END IF;
END
$$;

-- 4) Indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.admin_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.admin_audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_email ON public.admin_audit_log(actor_email);

-- 5) RLS + policy: tidak boleh diakses langsung dari client.
--    Admin app baca via service role (supabaseAdmin) di server.
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit log no client access" ON public.admin_audit_log;
CREATE POLICY "audit log no client access" ON public.admin_audit_log
  FOR ALL
  USING (false)
  WITH CHECK (false);
