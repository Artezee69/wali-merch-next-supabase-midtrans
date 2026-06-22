-- ============================================================
-- 009_admin_audit_actor_nullable.sql
-- Jadikan `actor_id` di `public.admin_audit_log` nullable agar kita
-- bisa merekam event auth yang gagal (`auth.login_failed`) sebelum
-- attacker beresolus menjadi user yang dikenal.
--
-- Latar belakang:
--   - `lib/adminAudit.ts` sekarang mengirim `actorId: string | null`
--     untuk event `auth.login_failed` (email tidak ditemukan, password
--     salah, atau profil bukan admin) sehingga baris log tetap
--     tercatat walaupun user tidak ter-resolve.
--   - Skema lama mendeklarasikan `actor_id UUID NOT NULL` di 006,
--     sehingga insert dari `login_failed` akan gagal dan kita
--     kehilangan jejak audit tepat saat paling dibutuhkan.
--   - Tidak ada constraint `FOREIGN KEY` di kolom ini di 006, jadi
--     pelonggaran ke NULL aman secara integritas referensial.
--
-- Aman dijalankan berulang (idempotent): ALTER COLUMN IF NOT NULL
-- untuk dokumentasi, dan DO block untuk drop NOT NULL hanya jika
-- masih ada.
-- ============================================================

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
