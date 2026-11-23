# Rencana supervisor (review otomatis adaCODE)
Status: BERJALAN · Sumber: review APPROVED (claude) · Diperbarui: 2026-11-23 11:24
<!-- adacode:rencana-supervisor — ditulis ulang tiap review; catatan Anda sendiri taruh di handoff lain -->

## Tugas terakhir
broi ukuran banner nya berapa x berapa cantumin di pas mau tambahin banner ,jadi gw tau ukurannya berapa kali berapa

## Ringkasan review
Perubahan sesuai permintaan: junior menambahkan blok "Ukuran gambar yang disarankan" di BannerForm.tsx (baris 211-218) yang mencantumkan ukuran konkret — Hero Slider 1920×1080 px (16:9) dengan minimum mobile 800×420 px, Promo Top/Bottom 600×400 px (3:2) dengan minimum mobile 400×260 px — sehingga pengguna kini tahu berapa×berapa saat menambah banner. Verifikasi konsistensi: klaim format file & batas 5MB cocok persis dengan app/api/admin/banners/upload/route.ts (MAX_BYTES 5MB, tipe PNG/JPG/WebP/SVG/GIF); klaim "gambar lama otomatis terhapus" cocok dengan actions.ts:222-225 (hapus oldPath hanya 

## Langkah berikutnya — JUNIOR
- [ ] (sedang) Perbaiki teks panduan ukuran hero mobile di components/admin/BannerForm.tsx agar mencerminkan rasio render aktual yang lebih kotak di mobile (atau tambahkan catatan area aman tengah).

## Langkah berikutnya — SENIOR (verifikasi)
- [ ] (sedang) Verifikasi visual ujung-ke-ujung halaman /admin/banners/new (desktop + mobile) dan homepage dengan banner hero+promo untuk memastikan panduan ukuran tampil rapi dan crop object-cover sesuai ekspektasi.

## Langkah berikutnya — PENGGUNA (keputusan/akses)
- [ ] (sedang) Selesaikan konflik dev server (matikan PID 26040 atau pakai port lain) lalu minta audit tampilan ulang dari adaCODE.
- [ ] (sedang) Daftarkan akun uji admin agar halaman admin bisa diaudit: adacode audit-ui akun --peran admin --email <email-admin>.
