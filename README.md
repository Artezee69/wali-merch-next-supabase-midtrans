# WALI Merch — Next.js + Supabase + Midtrans

MVP ecommerce custom: landing page, produk, cart, checkout Midtrans Snap, admin produk/order, upload foto ke Supabase Storage, cek pesanan, WhatsApp admin.

## Run local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka http://localhost:3000

## Supabase setup

1. Buat project Supabase.
2. Buka SQL Editor, paste `supabase/schema.sql`, lalu Run.
3. Buka Storage, buat bucket `product-images`, centang public bucket.
4. Ambil Project URL, anon key, service role key ke `.env.local`.

## Midtrans setup

1. Buat akun Midtrans Sandbox.
2. Ambil Server Key dan Client Key.
3. Isi `.env.local`.
4. Payment notification URL: `https://domain-lu.com/api/midtrans/notification`.

## Admin

Buka `/admin`, password dari `ADMIN_PASSWORD`.

Catatan: admin password cookie ini cocok untuk MVP/testing. Untuk production, upgrade ke Supabase Auth + role admin.
