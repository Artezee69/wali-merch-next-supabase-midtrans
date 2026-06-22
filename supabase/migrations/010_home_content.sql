-- ============================================================
-- 010_home_content.sql
-- Tabel `public.home_content` + `public.home_assets` untuk
-- halaman home yang bisa diedit dari admin panel.
--
-- Latar belakang:
--   - Hero / Marquee / WhyWali / HowToOrder / CTA / FAQ di
--     `components/home/*` selama ini hard-coded di source.
--   - Admin perlu mengubah copy/angka/ikon dari `/admin/settings`
--     tanpa deploy.
--   - `lib/homeContent.ts` akan membaca dari tabel ini (server-side
--     via service-role) dan mem-bundle ke client components sebagai
--     props.
--
-- Skema:
--   - home_content  : key-value TEXT (mirip store_settings tapi
--                     disimpan sebagai JSON value agar payload
--                     terstruktur seperti array FAQ/WhyWali).
--   - home_assets   : daftar aset gambar/ikon yang diupload admin
--                     (key TEXT PK, url TEXT, alt TEXT, updated_at).
--
-- Penulisan hanya via service-role. RLS di-disable + policy SELECT
-- untuk public (semua orang boleh baca), tapi tidak boleh INSERT/
-- UPDATE/DELETE dari anon/authenticated.
-- ============================================================

-- 1) Tabel home_content — JSON blobs per key
CREATE TABLE IF NOT EXISTS public.home_content (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 2) Tabel home_assets — daftar gambar/ikon
CREATE TABLE IF NOT EXISTS public.home_assets (
  key        TEXT PRIMARY KEY,
  url        TEXT NOT NULL,
  alt        TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 3) Touch updated_at trigger (reuse function dari 008)
DROP TRIGGER IF EXISTS trg_home_content_touch_updated_at ON public.home_content;
CREATE TRIGGER trg_home_content_touch_updated_at
  BEFORE UPDATE ON public.home_content
  FOR EACH ROW EXECUTE FUNCTION public.touch_store_settings_updated_at();

DROP TRIGGER IF EXISTS trg_home_assets_touch_updated_at ON public.home_assets;
CREATE TRIGGER trg_home_assets_touch_updated_at
  BEFORE UPDATE ON public.home_assets
  FOR EACH ROW EXECUTE FUNCTION public.touch_store_settings_updated_at();

-- 4) RLS — publik boleh baca, anon/authenticated tidak boleh tulis
ALTER TABLE public.home_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "home content public read" ON public.home_content;
CREATE POLICY "home content public read" ON public.home_content
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "home content no client write" ON public.home_content;
CREATE POLICY "home content no client write" ON public.home_content
  FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "home content no client update" ON public.home_content;
CREATE POLICY "home content no client update" ON public.home_content
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "home content no client delete" ON public.home_content;
CREATE POLICY "home content no client delete" ON public.home_content
  FOR DELETE
  USING (false);

DROP POLICY IF EXISTS "home assets public read" ON public.home_assets;
CREATE POLICY "home assets public read" ON public.home_assets
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "home assets no client write" ON public.home_assets;
CREATE POLICY "home assets no client write" ON public.home_assets
  FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "home assets no client update" ON public.home_assets;
CREATE POLICY "home assets no client update" ON public.home_assets
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "home assets no client delete" ON public.home_assets;
CREATE POLICY "home assets no client delete" ON public.home_assets
  FOR DELETE
  USING (false);

-- 5) Seed default content — sama persis dengan hard-coded values
--    yang ada di components/home/*, sehingga halaman tidak berubah
--    sebelum admin menyimpan nilai baru.
INSERT INTO public.home_content (key, value) VALUES
  ('hero', '{
    "badge": "Official Drop · 2026",
    "badgePill": "SS/26 Capsule",
    "headlineLine1": "Wear The",
    "headlineLine2a": "Stage",
    "headlineLine2b": "Energy",
    "subheadline": "Merchandise resmi WALI yang dirancang untuk fans, player, dan panggung. Material premium, jahitan rapi, dan siluet yang siap menemani setiap momen.",
    "primaryCtaLabel": "Shop Collection",
    "primaryCtaHref": "/products",
    "secondaryCtaLabel": "Track Order",
    "secondaryCtaHref": "/track-order",
    "stat1Value": "2.400+",
    "stat1Label": "Pieces Shipped",
    "stat2Value": "100%",
    "stat2Label": "Official",
    "stat3Value": "1–2d",
    "stat3Label": "Process",
    "trust1": "Garansi resmi",
    "trust2": "Midtrans secured checkout",
    "trust3": "Limited capsule"
  }'::jsonb),
  ('marquee', '{
    "items": [
      "Free Shipping Pulau Jawa",
      "Official Merchandise WALI",
      "Limited Drop Setiap Bulan",
      "Garansi Produk Resmi",
      "Bahan Premium & Awet"
    ]
  }'::jsonb),
  ('why_wali', '{
    "eyebrow": "Mengapa WALI",
    "title": "Bukan Sekadar Merch. Ini Tanda Pengalaman.",
    "subtitle": "Setiap item dibuat dengan perhatian yang sama terhadap detail yang kami berikan pada panggung — supaya kenangan bertahan lebih lama dari tur.",
    "items": [
      { "title": "Bahan Premium",       "body": "Cotton combed 24s–30s dan French terry tebal yang tidak mudah melar setelah dicuci." },
      { "title": "Jahitan Rapi",        "body": "Double-needle stitch di setiap sambungan agar kuat dipakai harian maupun di panggung." },
      { "title": "Desain Eksklusif",   "body": "Dirancang langsung oleh tim kreatif WALI — tidak dijual di tempat lain." },
      { "title": "Garansi Resmi",      "body": "Kalau ada cacat produksi, kami ganti baru tanpa ribet. S&K berlaku." }
    ]
  }'::jsonb),
  ('how_to_order', '{
    "eyebrow": "Cara Order",
    "title": "Dari Pilih Produk sampai Paket Datang",
    "subtitle": "Empat langkah simpel. Tidak perlu chat admin, tidak perlu nunggu konfirmasi manual.",
    "steps": [
      { "title": "Pilih Produk",     "body": "Telusuri koleksi di halaman Products. Pilih varian size dan warna yang kamu mau." },
      { "title": "Checkout",         "body": "Isi nama, alamat, dan nomor WhatsApp. Pilih metode pembayaran Midtrans favoritmu." },
      { "title": "Bayar",            "body": "Selesaikan pembayaran via QRIS, virtual account, e-wallet, atau kartu kredit." },
      { "title": "Paket Dikirim",    "body": "Pesanan diproses 1–2 hari kerja, lalu dikirim via ekspedisi ke alamatmu." }
    ]
  }'::jsonb),
  ('cta', '{
    "eyebrow": "Siap Naik Level?",
    "title": "Pakai WALI. Bawa Pulang Cerita Panggung.",
    "subtitle": "Capsule resmi WALI — siap menemani latihan, nonton bareng, atau tampil di panggung komunitasmu.",
    "primaryLabel": "Belanja Sekarang",
    "primaryHref": "/products",
    "secondaryLabel": "Lacak Pesanan",
    "secondaryHref": "/track-order"
  }'::jsonb),
  ('faq', '{
    "eyebrow": "Pertanyaan Umum",
    "title": "Yang Sering Ditanyain",
    "subtitle": "Belum ketemu jawabannya? Chat admin via WhatsApp di footer.",
    "items": [
      { "q": "Apakah produk ini original?",     "a": "Ya, semua merchandise di WALI Official Merchandise adalah barang resmi yang diproduksi langsung oleh tim WALI." },
      { "q": "Berapa lama pesanan diproses?",   "a": "Pesanan diproses dalam 1–2 hari kerja setelah pembayaran diterima. Hari besar dan weekend bisa lebih lama." },
      { "q": "Apakah bisa COD?",                "a": "Saat ini pembayaran menggunakan Midtrans (QRIS, virtual account, e-wallet, kartu kredit). COD belum tersedia." },
      { "q": "Bagaimana jika ukuran tidak pas?", "a": "Kami menyediakan size guide di setiap halaman produk. Jika tetap tidak pas, hubungi admin via WhatsApp untuk solusi terbaik." },
      { "q": "Apakah ada garansi?",             "a": "Ya, kami memberikan garansi untuk cacat produksi. Klaim garansi dapat diajukan melalui WhatsApp admin dengan menyertakan foto dan nomor pesanan." }
    ]
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;
