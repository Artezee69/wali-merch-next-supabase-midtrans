# Koreksi review adaCODE — halaman Penjualan Karyawan
Status: BERJALAN (kode + redesain UI selesai, BELUM di-commit) · Service: employee-sales · Diperbarui: 2026-11-24 15:55

## Sedang dikerjakan
Feats: (a) HPP inline per karyawan, (b) redesain UI biar rapi/simpel. Review adaCODE menemukan 6 masalah (F1–F3, F6, F7). Gw perbaiki semua; F6 = catatan handoff ini.

## Status terakhir
- **F1 (high) — route.ts:277-294 (F13 review lama)** — upsert massal menulis `hpp_snapshot: null` utk semua produk, snapshot yang udah pernah diinput terhapus.
  DIPERBAIKI: upsert massal TANPA kolom `hpp_snapshot`; snapshot ditulis terpisah hanya utk pid yang ada di `hppMap` (touched).
  *Uji DB prod:* pA snapshot=40000 → simpan `hpp_values=[pB=50000]` (pA gak disentuh) → pA tetap **40000**, pB jadi **50000**; pA dikosongkan → **null**. F1 TERTUTUP.
- **F2 (medium)** — `hppForDisplay` touched+kosong pakai `hpp_effective` (snapshot lama); label salah.
  DIPERBAIKI: touched+kosong → fallback `hpp_per_unit` (Kalkulator live); label baru `hppLabel()`: "custom" / "Kalkulator" / "tercatat".
- **F3 (medium)** — `addEmployee` pake `setEmployees(fresh)` dari filter ilike → jumlah di header salah.
  DIPERBAIKI: pake `data.employee.id`; reset `q`/`debouncedQ`; muat ulang full list.
- **F6 (medium)** — handoff lama ngaku "semua beres" padahal F13/F14 masih ada.
  DIPERBAIKI: handoff ini sekarang jelas + punya bagian "Masih terbuka".
- **F7 (medium) — route.ts + client:271-280** — `wasNew = data.employee === undefined` selalu `false` (POST selalu balikin `employee`), jadi admin yang baru nambah karyawan selalu lihat "sudah ada".
  DIPERBAIKI: route tambahin field `created: boolean` di respons POST (true saat insert karyawan baru, false saat nama sudah ada). Client pake `data.created === true`.
  *Uji DB prod (simulate logika route):* nama baru → `created=true`; nama sama → `created=false`; id sama. F7 TERTUTUP.
- **Redesain UI (non-fix)** — layout baru: top bar + compact sidebar + table lebih bersih, label HPP lebih jelas. Selesai di `EmployeeSalesClient.tsx`.

## Verifikasi (bukti terukur, keluaran perintah)
- `npx tsc --noEmit` → exit 0.
- Uji F1 DB prod: 4 skenario (40000/50000/null) — semua sesuai, di-cleanup.
- Uji F7 DB prod: `created` flag benar untuk insert baru vs. existing, di-cleanup.

## Masih terbuka (belum di-commit / butuh tindakan lu)
- [ ] COMMIT perubahan F1/F2/F3/F7 + redesain UI ini (keputusan user — review larang gw commit).
- [ ] Setelah commit, perbarui kolom Deploy CHANGELOG Fix #14.
- Catatan: angka 40000/50000 di atas nilai uji DB, bukan angka bisnis.

## Jangan lakukan (jebakan)
- JANGAN upsert `hpp_snapshot` di upsert massal — snapshot lama terhapus (F1/F13).
- JANGAN fallback `hppForDisplay` touched+kosong ke `hpp_effective` (F2/F14).
- JANGAN `setEmployees(filteredList)` di `addEmployee` (F3).
- JANGAN klaim "semua beres" di handoff tanpa verifikasi (F6).
- JANGAN infer status dari `data.employee === undefined` — pake penanda eksplisit `created` (F7).
