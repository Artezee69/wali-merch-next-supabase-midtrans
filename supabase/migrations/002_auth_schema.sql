-- =====================================================
-- Migration: Customer Authentication Schema
-- Date: 2026-06-08
-- Description: profiles, carts, cart_items tables
--              with RLS policies and storage setup
-- =====================================================

create extension if not exists "pgcrypto";

-- ===== PROFILES TABLE =====
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null unique,
  email text not null unique,
  address text not null,
  birth_date date,
  gender text check (gender in ('male', 'female', 'other')),
  profile_image_url text,
  is_email_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

-- RLS Policies for profiles
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Auto-update trigger for profiles
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at();

-- ===== CARTS TABLE =====
create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table carts enable row level security;

-- RLS Policies for carts
create policy "Users can view own cart"
  on carts for select using (auth.uid() = user_id);

create policy "Users can create own cart"
  on carts for insert with check (auth.uid() = user_id);

create policy "Users can update own cart"
  on carts for update using (auth.uid() = user_id);

create policy "Users can delete own cart"
  on carts for delete using (auth.uid() = user_id);

-- ===== CART ITEMS TABLE =====
create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  price_at_add integer not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(cart_id, product_id, variant_id)
);

alter table cart_items enable row level security;

-- RLS Policies for cart_items
create policy "Users can view own cart items"
  on cart_items for select
  using (cart_id in (select id from carts where user_id = auth.uid()));

create policy "Users can insert own cart items"
  on cart_items for insert
  with check (cart_id in (select id from carts where user_id = auth.uid()));

create policy "Users can update own cart items"
  on cart_items for update
  using (cart_id in (select id from carts where user_id = auth.uid()));

create policy "Users can delete own cart items"
  on cart_items for delete
  using (cart_id in (select id from carts where user_id = auth.uid()));

-- Auto-update trigger for cart_items
drop trigger if exists cart_items_updated_at on cart_items;
create trigger cart_items_updated_at
  before update on cart_items
  for each row
  execute function update_updated_at();

-- ===== FUNCTION: get_user_cart_id =====
-- Helper function to get or create cart for current user
create or replace function get_user_cart_id()
returns uuid as $$
declare
  cart_id uuid;
begin
  -- Try to get existing cart
  select id into cart_id from carts where user_id = auth.uid();

  if cart_id is null then
    -- Create new cart
    insert into carts (user_id) values (auth.uid()) returning id into cart_id;
  end if;

  return cart_id;
end;
$$ language plpgsql security definer;
