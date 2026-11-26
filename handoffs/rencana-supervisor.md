# Rencana supervisor (review otomatis adaCODE)
Status: BERJALAN · Sumber: review REVISE (claude) · Diperbarui: 2026-11-25 20:58
<!-- adacode:rencana-supervisor — ditulis ulang tiap review; catatan Anda sendiri taruh di handoff lain -->

## Tugas terakhir
jujur kurang rapih ni bro redesain dong biar rapih bagus dan lebih simple mudah gitu

## Ringkasan review
Koreksi putaran 2 menutup semua temuan high/medium lama: F7 (penanda `created`) saya konfirmasi tertutup — route.ts:238,255,339 mengirim `created: employeeCreated` dan client memakai `data.created === true` (EmployeeSalesClient.tsx:272). F13 (high, upsert menimpa snapshot) juga tertutup: upsert massal tidak lagi menulis `hpp_snapshot` (route.ts:279-295) dan snapshot ditulis terpisah hanya untuk pid di `hppMap` (route.ts:310-326). F14 (medium, fallback touched-kosong) tertutup: `hppForDisplay` mengembalikan `p.hpp_per_unit` saat touched+kosong (EmployeeSalesClient.tsx:63-69) dengan label mengik

## Temuan review yang masih terbuka — JUNIOR
- [ ] [F1 · medium] components/admin/EmployeeSalesClient.tsx:150-170 (deps :165) + components/Toast.tsx:28-43 — Keluarkan `toast` dari dependensi: simpan `toast.show` di ref (`const toastRef = useRef(toast.show); toastRef.current = toast.show;`) lalu pakai `toastRef.current(...)` di dalam `loadEmployees`, atau bungkus `value` provider dengan `useMemo(() => ({ show }), [show])` di components/Toast.tsx:42-43. S

## Langkah berikutnya — JUNIOR
- [ ] (tinggi) Hilangkan `toast` dari dependensi `loadEmployees` di components/admin/EmployeeSalesClient.tsx (pakai ref atau `useMemo` pada value ToastProvider) agar tidak ada refetch/loop saat toast muncul.
- [ ] (sedang) Satukan dua GET setelah simpan di EmployeeSalesClient.tsx:325-331 menjadi satu `fetchEmployeesRaw` yang sekaligus mengisi `employees` dan me-reseed draft (F9).
- [ ] (sedang) Ubah penanganan kegagalan HPP di app/api/admin/employee-sales/route.ts:313-326 menjadi respons parsial (entry tersimpan + `warning`/`failed_products`) dan tetap panggil `logAdminAction`.
- [ ] (rendah) Rapikan sisa low: hapus `PillTone`/`status`/`totalSpecial` (EmployeeSalesClient.tsx:22,32,344-356), lengkapi komentar Body POST dengan `hpp_values`, filter `product_id` kosong + pakai `eq` untuk lookup nama, dan betulkan hitungan berkas di CHANGELOG_FIXES.md:5 (4 M + 1 `??`).
- [ ] (rendah) Buat layout halaman employee-sales bertumpuk di layar kecil (flex-col → lg:flex-row) dan ganti ikon `Trash2` pada toggle tambah karyawan menjadi ikon tutup (X).

## Langkah berikutnya — SENIOR (verifikasi)
- [ ] (tinggi) Uji ujung-ke-ujung setelah dev server hidup: simpan HPP 40.000 untuk produk A, reload, ubah ceklis produk B, simpan, lalu pastikan label produk A tetap 'tercatat' dan jumlah request jaringan tidak berulang.

## Langkah berikutnya — PENGGUNA (keputusan/akses)
- [ ] (sedang) Hentikan dev server lama (PID 26040 / localhost:3000) supaya audit tampilan /admin/employee-sales dan verifikasi visual redesain bisa dijalankan.
- [ ] (sedang) Daftarkan akun uji admin (`adacode audit-ui akun --peran admin --email <email>`) agar halaman ber-login ini bisa diaudit sebagai admin, dan putuskan nasib commit revisi employee-sales (masih 4 berkas M + 1 handoff baru di working tree).
