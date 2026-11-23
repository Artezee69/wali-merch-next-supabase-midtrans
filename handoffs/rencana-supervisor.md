# Rencana supervisor (review otomatis adaCODE)
Status: BERJALAN · Sumber: review REVISE (claude) · Diperbarui: 2026-11-23 23:37
<!-- adacode:rencana-supervisor — ditulis ulang tiap review; catatan Anda sendiri taruh di handoff lain -->

## Tugas terakhir
apa si bro astaga , udah gw save diskonnya masih ga muncul, tadi pas lagi progress udah muncul setelah lu selesai jadi ilang lagi gimana sih, plis lah benerin yg bener bro

## Ringkasan review
Koreksi putaran 2 untuk temuan utama (F5/high) SUDAH BENAR dan konsisten di semua 4 titik tulis: PUT variants (variants/route.ts:238-258), POST bulk variants (368-388), POST products (route.ts:345-368), dan PATCH [id] (526-554) kini sama-sama menghitung `minBase` (harga normal termurah), `minEffective` (harga bayar termurah), dan `minSale` (diskon termurah, null bila tak ada) dari varian aktif. Typecheck `tsc --noEmit` lolos (exit 0). Namun review menemukan SATU masalah medium baru (F10): form edit admin masih mem-prefill "harga normal" dari `product.price` yang sekarang ber-semantik HARGA EFE

## Temuan review yang masih terbuka — JUNIOR
- [ ] [F10 · medium] app/admin/products/[id]/edit/page.tsx:67 — Ganti prefill di app/admin/products/[id]/edit/page.tsx:67 menjadi `base_price: product.base_price ?? product.price ?? 0` agar form mengambil harga NORMAL (pre-diskon), bukan harga efektif. Opsional: di PATCH app/api/admin/products/[id]/route.ts, tolak/abaikan `sale_price >= base_price` dari payload 

## Langkah berikutnya — JUNIOR
- [ ] (tinggi) Perbaiki F10: ubah prefill app/admin/products/[id]/edit/page.tsx:67 menjadi `base_price: product.base_price ?? product.price ?? 0` dan tambah guard `sale_price < base_price` di PATCH [id]/route.ts.
- [ ] (sedang) Perbaiki F6: reset `productsError = null` di awal cabang fallback app/products/page.tsx agar banner merah hanya muncul saat data benar-benar gagal dimuat.
- [ ] (sedang) Samakan perilaku penulisan `stock` level produk (F9) di PATCH [id] vs PUT/POST variants vs POST products, dan hapus komentar 'kolom stock TIDAK ADA' yang menyesatkan.
- [ ] (rendah) Tambahkan validasi `sale_price < price` dan dukungan set null pada bulk POST /api/admin/products/variants (F11).
- [ ] (rendah) Setelah diskon terverifikasi tampil lewat audit UI, hapus total blok DEBUG baris 176-187 app/products/page.tsx (F7).

## Langkah berikutnya — SENIOR (verifikasi)
- [ ] (tinggi) Uji ujung-ke-ujung skenario regresi pengguna: set diskon varian → simpan → buka edit → simpan lagi → pastikan badge & harga coret tidak hilang (jalur PUT variants dan PATCH [id]).

## Langkah berikutnya — PENGGUNA (keputusan/akses)
- [ ] (tinggi) Hentikan server dev lama yang memblokir audit (taskkill /PID 26040 /F) lalu minta audit tampilan ulang untuk memverifikasi diskon varian tampil di /products sebagai harga coret + badge persen.
