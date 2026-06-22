-- =====================================================
-- Migration: Auto-create profile row on auth.user signup
-- Date: 2026-06-08
-- Description:
--   The customer auth flow requires email verification, which means
--   the new user is NOT authenticated at the moment signUp() returns.
--   That breaks client-side RLS inserts (auth.uid() is null) and the
--   profile row was silently never created.
--
--   This trigger creates a public.profiles row server-side, from the
--   raw_user_meta_data we already pass in options.data during signUp.
--   It uses SECURITY DEFINER so it can insert regardless of RLS, and
--   ON CONFLICT DO NOTHING so re-fires are safe.
-- =====================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb;
  v_full_name text;
  v_phone text;
  v_address text;
  v_birth_date date;
  v_gender text;
  v_avatar text;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);

  v_full_name := coalesce(
    nullif(trim(meta->>'full_name'), ''),
    split_part(new.email, '@', 1),
    'Pengguna'
  );
  v_phone := nullif(trim(meta->>'phone'), '');
  v_address := coalesce(nullif(trim(meta->>'address'), ''), '-');
  v_gender := nullif(trim(meta->>'gender'), '');

  begin
    v_birth_date := nullif(trim(meta->>'birth_date'), '')::date;
  exception when others then
    v_birth_date := null;
  end;

  v_avatar := nullif(trim(meta->>'profile_image_url'), '');

  -- Phone is NOT NULL UNIQUE in profiles. If metadata lacks a phone,
  -- we cannot insert — but we must NOT block the auth signup. Use a
  -- unique-per-user placeholder so the trigger never breaks auth.
  if v_phone is null then
    v_phone := 'pending:' || new.id::text;
  end if;

  insert into public.profiles (
    id, full_name, phone, email, address, birth_date, gender,
    profile_image_url, is_email_verified
  ) values (
    new.id,
    v_full_name,
    v_phone,
    new.email,
    v_address,
    v_birth_date,
    v_gender,
    v_avatar,
    new.email_confirmed_at is not null
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
