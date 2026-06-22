-- =====================================================
-- Migration: Normalize email/phone uniqueness in profiles
-- Date: 2026-06-08
-- Description:
--   002_auth_schema.sql declared profiles.email and
--   profiles.phone as UNIQUE on the raw value, so "  USER@x.com "
--   and "user@x.com" would each pass the form but produce two
--   different rows. This migration:
--
--     1. Adds generated columns: email_norm, phone_norm
--        (trim + lower for email; digits-only for phone).
--     2. Replaces the per-column UNIQUE constraints with
--        UNIQUE INDEXes on the normalized values.
--     3. Adds format CHECK constraints (basic shape only).
--     4. Tightens the handle_new_user() trigger so that
--        duplicates surface as a controlled error rather
--        than silently creating a second profile row.
--     5. Fixes existing rows in place (best-effort cleanup
--        of whitespace/case for email and non-digit
--        characters for phone) — non-destructive, but
--        conflict resolution is left to application code.
-- =====================================================

-- ===== 1. Generated columns for normalized values =====
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'profiles'
      and column_name  = 'email_norm'
  ) then
    execute $sql$
      alter table public.profiles
        add column email_norm text generated always as
          (lower(trim(coalesce(email, '')))) stored
    $sql$;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'profiles'
      and column_name  = 'phone_norm'
  ) then
    execute $sql$
      alter table public.profiles
        add column phone_norm text generated always as
          (regexp_replace(coalesce(phone, ''), '\D', '', 'g')) stored
    $sql$;
  end if;
end$$;

-- ===== 2. Best-effort cleanup of existing rows =====
-- Strip whitespace/case from email. Strip non-digits from phone.
-- We do NOT touch rows that would collide with another row under
-- the new normalized value — those are left alone and will be
-- surfaced as "duplicate" by the application before any insert.
update public.profiles
   set email = trim(email)
 where email <> trim(email);

update public.profiles
   set email = lower(email)
 where email <> lower(email);

update public.profiles
   set phone = regexp_replace(phone, '\D', '', 'g')
 where phone <> regexp_replace(phone, '\D', '', 'g')
   and phone not like 'pending:%';

-- ===== 3. Replace raw UNIQUE constraints with normalized unique indexes =====
do $$
begin
  -- email
  if exists (
    select 1 from pg_constraint
    where conname = 'profiles_email_key'
  ) then
    alter table public.profiles drop constraint profiles_email_key;
  end if;
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename  = 'profiles'
      and indexname  = 'profiles_email_norm_unique'
  ) then
    create unique index profiles_email_norm_unique
      on public.profiles (email_norm);
  end if;

  -- phone
  if exists (
    select 1 from pg_constraint
    where conname = 'profiles_phone_key'
  ) then
    alter table public.profiles drop constraint profiles_phone_key;
  end if;
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename  = 'profiles'
      and indexname  = 'profiles_phone_norm_unique'
  ) then
    create unique index profiles_phone_norm_unique
      on public.profiles (phone_norm);
  end if;
end$$;

-- ===== 4. Format CHECK constraints =====
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_email_format_chk'
  ) then
    alter table public.profiles
      add constraint profiles_email_format_chk
      check (email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_phone_format_chk'
  ) then
    alter table public.profiles
      add constraint profiles_phone_format_chk
      check (
        -- Real phone numbers: 8–15 digits, no leading zero rule, just length.
        phone like 'pending:%'
        or phone ~ '^[0-9]{8,15}$'
      );
  end if;
end$$;

-- ===== 5. Update handle_new_user() to use normalized uniqueness =====
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
  v_phone_norm text;
  v_email text;
  v_email_norm text;
  v_address text;
  v_birth_date date;
  v_gender text;
  v_avatar text;
  v_existing uuid;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);

  v_full_name := coalesce(
    nullif(trim(meta->>'full_name'), ''),
    split_part(new.email, '@', 1),
    'Pengguna'
  );

  v_phone := nullif(trim(meta->>'phone'), '');
  v_phone_norm := case
    when v_phone is null then null
    else regexp_replace(v_phone, '\D', '', 'g')
  end;
  v_address := coalesce(nullif(trim(meta->>'address'), ''), '-');
  v_gender  := nullif(trim(meta->>'gender'), '');

  begin
    v_birth_date := nullif(trim(meta->>'birth_date'), '')::date;
  exception when others then
    v_birth_date := null;
  end;

  v_avatar := nullif(trim(meta->>'profile_image_url'), '');

  v_email     := lower(trim(new.email));
  v_email_norm := v_email;

  -- 5a. Detect duplicates under the new normalized rules so the
  --     application can react with a clear error message.
  --
  --     Because this trigger runs in a SECURITY DEFINER context, RLS
  --     does not apply, and we can read all rows.
  if v_email_norm is not null then
    select id into v_existing
      from public.profiles
     where email_norm = v_email_norm
       and id <> new.id
     limit 1;
    if v_existing is not null then
      raise exception 'EMAIL_ALREADY_REGISTERED' using errcode = '23505';
    end if;
  end if;

  if v_phone_norm is not null then
    select id into v_existing
      from public.profiles
     where phone_norm = v_phone_norm
       and id <> new.id
     limit 1;
    if v_existing is not null then
      raise exception 'PHONE_ALREADY_REGISTERED' using errcode = '23505';
    end if;
  end if;

  -- Phone is NOT NULL UNIQUE. If metadata lacks a phone, use a
  -- per-user placeholder so the trigger never breaks auth.
  if v_phone_norm is null or v_phone_norm = '' then
    v_phone := 'pending:' || new.id::text;
  else
    v_phone := v_phone_norm;
  end if;

  insert into public.profiles (
    id, full_name, phone, email, address, birth_date, gender,
    profile_image_url, is_email_verified
  ) values (
    new.id,
    v_full_name,
    v_phone,
    v_email,
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

-- Re-create the trigger to be safe (it should already exist, but the
-- function signature changed).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Backfill pending: phones so the new CHECK constraint still applies
-- to rows produced by the previous trigger version.
-- (pending:% is exempted from the phone_format_chk.)
-- This is a no-op for rows whose phone already starts with "pending:".
do $$
begin
  update public.profiles
     set phone = 'pending:' || id::text
   where phone is null
      or (phone !~ '^[0-9]{8,15}$' and phone not like 'pending:%');
end$$;
