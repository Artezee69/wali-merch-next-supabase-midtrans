-- ============================================================
-- 028_home_content_table.sql
-- Membuat tabel home_content (key-value JSON) yang dipakai oleh
-- lib/homeContent.ts untuk menyimpan konten section homepage
-- (hero, marquee, why_wali, how_to_order, cta, faq, showcase).
--
-- Catatan: migration 010_home_content.sql tidak pernah dibuat,
-- sehingga table ini belum ada di DB. File ini mengisi kekosongan.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.home_content (
  key    text PRIMARY KEY,
  value  jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: hanya service role (admin backend) boleh menulis; public boleh membaca
ALTER TABLE public.home_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read home_content"
  ON public.home_content FOR SELECT USING (true);

CREATE POLICY "Service role can insert home_content"
  ON public.home_content FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
  );

CREATE POLICY "Service role can update home_content"
  ON public.home_content FOR UPDATE USING (
    auth.role() = 'service_role'
  );

CREATE POLICY "Service role can delete home_content"
  ON public.home_content FOR DELETE USING (
    auth.role() = 'service_role'
  );

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trg_home_content_touch_updated_at ON public.home_content;
CREATE TRIGGER trg_home_content_touch_updated_at
  BEFORE UPDATE ON public.home_content
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- Seed default values (idempotent — tidak menimpa yang sudah ada)
INSERT INTO public.home_content (key, value) VALUES
  ('hero', $j$
  {
    "badge": "Official Drop · 2026",
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
    "backgroundType": "gradient",
    "backgroundColor": "#0b0b0b"
  }
  $j$)
  ON CONFLICT (key) DO NOTHING;

INSERT INTO public.home_content (key, value) VALUES
  ('marquee', $j$
  {
    "items": ["Free Shipping Pulau Jawa", "Official Merchandise WALI", "Limited Drop Setiap Bulan", "Garansi Produk Resmi", "Bahan Premium & Awet"]
  }
  $j$)
  ON CONFLICT (key) DO NOTHING;

INSERT INTO public.home_content (key, value) VALUES
  ('why_wali', $j$
  {
    "eyebrow": "Mengapa WALI",
    "title": "Bukan Sekadar Merch. Ini Tanda Pengalaman.",
    "subtitle": "Setiap item dibuat dengan perhatian yang sama terhadap detail yang kami berikan pada panggung — supaya kenangan bertahan lebih lama dari tur.",
    "items": [
      { "title": "Bahan Premium", "body": "Cotton combed 24s–30s dan French terry tebal yang tidak mudah melar setelah dicuci." },
      { "title": "Jahitan Rapi", "body": "Double-needle stitch di setiap sambungan agar kuat dipakai harian maupun di panggung." },
      { "title": "Desain Eksklusif", "body": "Dirancang langsung oleh tim kreatif WALI — tidak dijual di tempat lain." },
      { "title": "Garansi Resmi", "body": "Kalau ada cacat produksi, kami ganti baru tanpa ribet. S&K berlaku." }
    ]
  }
  $j$)
  ON CONFLICT (key) DO NOTHING;

INSERT INTO public.home_content (key, value) VALUES
  ('how_to_order', $j$
  {
    "eyebrow": "Cara Order",
    "title": "Dari Pilih Produk sampai Paket Datang",
    "subtitle": "Empat langkah simpel. Tidak perlu chat admin, tidak perlu nunggu konfirmasi manual.",
    "steps": [
      { "title": "Pilih Produk", "body": "Telusuri koleksi di halaman Products. Pilih varian size dan warna yang kamu mau." },
      { "title": "Checkout", "body": "Isi nama, alamat, dan nomor WhatsApp. Pilih metode pembayaran Midtrans favoritmu." },
      { "title": "Bayar", "body": "Selesaikan pembayaran via QRIS, virtual account, e-wallet, atau kartu kredit." },
      { "title": "Paket Dikirim", "body": "Pesanan diproses 1–2 hari kerja, lalu dikirim via ekspedisi ke alamatmu." }
    ]
  }
  $j$)
  ON CONFLICT (key) DO NOTHING;

INSERT INTO public.home_content (key, value) VALUES
  ('cta', $j$
  {
    "eyebrow": "Siap Naik Level?",
    "title": "Pakai WALI. Bawa Pulang Cerita Panggung.",
    "subtitle": "Capsule resmi WALI — siap menemani latihan, nonton bareng, atau tampil di panggung komunitasmu.",
    "primaryLabel": "Belanja Sekarang",
    "primaryHref": "/products",
    "secondaryLabel": "Lacak Pesanan",
    "secondaryHref": "/track-order"
  }
  $j$)
  ON CONFLICT (key) DO NOTHING;

INSERT INTO public.home_content (key, value) VALUES
  ('faq', $j$
  {
    "eyebrow": "Pertanyaan Umum",
    "title": "Yang Sering Ditanyain",
    "subtitle": "Belum ketemu jawabannya? Chat admin via WhatsApp di footer.",
    "items": [
      { "q": "Apakah produk ini original?", "a": "Ya, semua merchandise di WALI Official Merchandise adalah barang resmi yang diproduksi langsung oleh tim WALI." },
      { "q": "Berapa lama pesanan diproses?", "a": "Pesanan diproses dalam 1–2 hari kerja setelah pembayaran diterima. Hari besar dan weekend bisa lebih lama." },
      { "q": "Apakah bisa COD?", "a": "Saat ini pembayaran menggunakan Midtrans (QRIS, virtual account, e-wallet, kartu kredit). COD belum tersedia." }
    ]
  }
  $j$)
  ON CONFLICT (key) DO NOTHING;

INSERT INTO public.home_content (key, value) VALUES
  ('showcase', $j$
  {
    "eyebrow": "Koleksi Pilihan",
    "title": "Baju yang Bikin Penampilan Terasa Panggung.",
    "subtitle": "Pilihan item yang paling banyak di-restock minggu ini. Limited capsule, tidak di-print ulang.",
    "viewAllLabel": "Lihat Semua Koleksi",
    "emptyLabel": "Belum ada produk yang dipublikasikan."
  }
  $j$)
  ON CONFLICT (key) DO NOTHING;

COMMIT;
