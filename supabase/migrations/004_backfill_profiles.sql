-- =====================================================
-- Backfill profiles for accounts created before the
-- `handle_new_user` trigger existed.
--
-- SAFE TO RE-RUN: uses ON CONFLICT (id) DO NOTHING, so any
-- existing profile rows (with real data) are preserved.
--
-- Run this once in Supabase SQL editor, AFTER applying
-- 002_auth_schema.sql AND 003_auto_create_profile.sql.
-- =====================================================

insert into public.profiles (
  id,
  full_name,
  phone,
  email,
  address,
  birth_date,
  gender,
  profile_image_url,
  is_email_verified
)
select
  au.id,
  -- full_name: prefer metadata, fall back to email local-part, then 'Pengguna'
  coalesce(
    nullif(trim(au.raw_user_meta_data->>'full_name'), ''),
    split_part(au.email, '@', 1),
    'Pengguna'
  ),
  -- phone: profiles.phone is NOT NULL UNIQUE. If metadata is missing
  -- phone (typical for accounts created before 002_auth_schema.sql),
  -- use a per-user placeholder so the row can be inserted without
  -- colliding with any real phone. Users can fix this in the
  -- account page after login.
  coalesce(
    nullif(trim(au.raw_user_meta_data->>'phone'), ''),
    'pending:' || au.id::text
  ),
  au.email,
  coalesce(nullif(trim(au.raw_user_meta_data->>'address'), ''), '-'),
  -- birth_date: only cast when present and well-formed
  case
    when nullif(trim(au.raw_user_meta_data->>'birth_date'), '') is null then null
    else (nullif(trim(au.raw_user_meta_data->>'birth_date'), ''))::date
  end,
  nullif(trim(au.raw_user_meta_data->>'gender'), ''),
  nullif(trim(au.raw_user_meta_data->>'profile_image_url'), ''),
  au.email_confirmed_at is not null
from auth.users au
where not exists (
  select 1 from public.profiles p where p.id = au.id
);
