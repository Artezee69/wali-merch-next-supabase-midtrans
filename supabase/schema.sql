create extension if not exists "pgcrypto";

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  price integer not null,
  category text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  image_url text not null,
  sort_order integer default 0
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  size text not null,
  stock integer not null default 0
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null,
  customer_name text not null,
  customer_email text,
  customer_phone text not null,
  address text not null,
  province text,
  city text,
  district text,
  postal_code text,
  notes text,
  subtotal integer not null default 0,
  shipping_cost integer not null default 0,
  shipping_service text,
  total_amount integer not null,
  payment_status text default 'pending',
  order_status text default 'waiting_payment',
  midtrans_token text,
  midtrans_redirect_url text,
  tracking_number text,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  product_name text not null,
  size text,
  price integer not null,
  quantity integer not null,
  subtotal integer not null
);

alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "Public can read active products" on products for select using (is_active = true);
create policy "Public can read product images" on product_images for select using (true);
create policy "Public can read variants" on product_variants for select using (true);
create policy "Public can read orders by direct code page" on orders for select using (true);
create policy "Public can read order items" on order_items for select using (true);

insert into products (name, slug, description, price, category) values
('WALI Player Edition T-Shirt', 'wali-player-edition-t-shirt', 'Kaos regular fit premium. Cocok untuk fans, player, dan stage culture.', 175000, 'T-Shirt')
on conflict (slug) do nothing;

insert into product_variants (product_id, size, stock)
select id, 'M', 10 from products where slug='wali-player-edition-t-shirt'
on conflict do nothing;
insert into product_variants (product_id, size, stock)
select id, 'L', 10 from products where slug='wali-player-edition-t-shirt'
on conflict do nothing;
