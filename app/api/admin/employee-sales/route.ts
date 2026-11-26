import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { getAdminContext, isResponse } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { pickEffectivePrice } from "@/lib/productHelpers";
import { logAdminAction } from "@/lib/adminAudit";

/* ============ Types ============ */

export type EmployeeProduct = {
  id: string;
  name: string;
  sell_price: number;
  sale_price: number | null;
  status: string;
  has_variants: boolean;
  // HPP total per unit (sum of hpp_items + overhead_items from product_hpp)
  hpp_per_unit: number;
  // HPP efektif untuk karyawan ini: hpp_snapshot (jika ada) > hpp_per_unit
  hpp_effective: number;
  // Employee sales state for the current employee (if any)
  purchased: boolean;
  special_price: number | null;
  hpp_snapshot: number | null;
};

export type EmployeeRow = {
  id: string;
  full_name: string;
  note: string | null;
  created_at: string;
  sales: EmployeeProduct[];
};

export type EmployeeSalesPayload = {
  employee_name: string;
  employee_note?: string | null;
  entries: Array<{
    product_id: string;
    special_price?: number | null;
    purchased: boolean;
  }>;
  /**
   * Opsional: HPP per unit yang diinput dari halaman penjualan karyawan.
   * Disimpan di `employee_sales.hpp_snapshot` (per karyawan + produk),
   * BUKAN ke tabel bersama `product_hpp` — jadi angka Kalkulator HPP
   * tidak ikut berubah dan tidak membengkak. null = mengosongkan
   * (kembali ke HPP Kalkulator HPP).
   */
  hpp_values?: Array<{ product_id: string; hpp: number | null }>;
};

/* ============ Helpers ============ */

function computeHppPerUnit(hppRow: Record<string, unknown> | null): number {
  if (!hppRow) return 0;
  const items = (hppRow.hpp_items as Array<{ amount?: number; qty?: number | null }> | undefined) ?? [];
  const overheads = (hppRow.overhead_items as Array<{ amount?: number; qty?: number | null }> | undefined) ?? [];
  const sum = (arr: Array<{ amount?: number; qty?: number | null }>) =>
    arr.reduce((s, i) => s + (Number(i.amount) || 0) * (i.qty ?? 1), 0);
  return sum(items) + sum(overheads);
}

/* ============ GET ============ */

// GET /api/admin/employee-sales
// Query: ?q=<nama karyawan>  (filter search)
// Return: list karyawan + (untuk karyawan pertama yang match / atau yang dipilih
// lewat ?employee_id=) daftar produk + status beli + margin.
export async function GET(request: NextRequest) {
  const admin = await getAdminContext();
  if (isResponse(admin)) return admin;
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const employeeId = searchParams.get("employee_id") || "";

  // Ambil semua karyawan
  let employeesQuery = supabaseAdmin.from("employees").select("*").order("created_at", { ascending: true });
  if (q) employeesQuery = employeesQuery.ilike("full_name", `%${q}%`);
  const { data: employees, error: empErr } = await employeesQuery;
  if (empErr) {
    console.error("[API /api/admin/employee-sales] GET employees error:", empErr.message);
    return NextResponse.json(
      { error: "Gagal memuat karyawan", details: empErr.message },
      { status: 500 }
    );
  }

  // Ambil semua produk (nama, harga jual, HPP)
  const { data: products, error: prodErr } = await supabaseAdmin
    .from("products")
    .select("id, name, status, has_variants, price, base_price, sale_price")
    .order("name", { ascending: true });
  if (prodErr) {
    console.error("[API /api/admin/employee-sales] GET products error:", prodErr.message);
    return NextResponse.json(
      { error: "Gagal memuat produk", details: prodErr.message },
      { status: 500 }
    );
  }

  // Ambil semua data HPP (1 row per produk)
  const productIds = (products ?? []).map((p: any) => p.id as string);
  const { data: hppRows } = productIds.length
    ? await supabaseAdmin
        .from("product_hpp")
        .select("product_id, hpp_items, overhead_items")
        .in("product_id", productIds)
    : { data: [] as any[] };

  const hppByProduct = new Map<string, Record<string, unknown>>();
  for (const row of (hppRows ?? []) as Array<Record<string, unknown>>) {
    hppByProduct.set(row.product_id as string, row);
  }

  const hppPerUnitByProduct = new Map<string, number>();
  for (const p of (products ?? []) as Array<Record<string, unknown>>) {
    hppPerUnitByProduct.set(p.id as string, computeHppPerUnit(hppByProduct.get(p.id as string) ?? null));
  }

  // Semua penjualan karyawan (untuk hitung status beli per karyawan)
  const { data: allSales } = await supabaseAdmin
    .from("employee_sales")
    .select("employee_id, product_id, special_price, hpp_snapshot, purchased")
    .order("created_at", { ascending: false });

  const salesByEmployee = new Map<string, Array<Record<string, unknown>>>();
  for (const row of (allSales ?? []) as Array<Record<string, unknown>>) {
    const arr = salesByEmployee.get(row.employee_id as string) ?? [];
    arr.push(row);
    salesByEmployee.set(row.employee_id as string, arr);
  }

  const employeeList = (employees ?? []).map((e: Record<string, unknown>) => {
    const sales = salesByEmployee.get(e.id as string) ?? [];
    const salesByProduct = new Map<string, Record<string, unknown>>();
    for (const s of sales) {
      salesByProduct.set(s.product_id as string, s);
    }

    const enrichedProducts: EmployeeProduct[] = ((products ?? []) as Array<Record<string, unknown>>).map((p) => {
      const effectivePrice = pickEffectivePrice({
        base_price: (p.base_price as number | null) ?? null,
        sale_price: (p.sale_price as number | null) ?? null,
      });
      const salePrice = (p.sale_price as number | null) ?? null;
      const fallback =
        (typeof p.price === "number" ? p.price : null) ??
        (typeof p.base_price === "number" ? p.base_price : null) ??
        0;
      const sellPrice = salePrice ?? effectivePrice ?? fallback;

      const pid = p.id as string;
      const s = salesByProduct.get(pid);
      // HPP dari Kalkulator HPP (product_hpp) — nilai awal / fallback
      const hppPerUnit = hppPerUnitByProduct.get(pid) ?? 0;
      // HPP yang tercatat untuk karyawan ini (employee_sales.hpp_snapshot)
      const hppSnapshot = s && s.hpp_snapshot != null ? Number(s.hpp_snapshot) : null;
      // HPP efektif: prioritaskan catatan karyawan, lalu Kalkulator HPP
      const hppEffective = hppSnapshot != null ? hppSnapshot : hppPerUnit;
      return {
        id: pid,
        name: p.name as string,
        sell_price: sellPrice,
        sale_price: salePrice,
        status: p.status as string,
        has_variants: Boolean(p.has_variants),
        hpp_per_unit: hppPerUnit,
        hpp_effective: hppEffective,
        purchased: s ? Boolean(s.purchased) : false,
        special_price: s ? Number(s.special_price) : null,
        hpp_snapshot: hppSnapshot,
      };
    });

    return {
      id: e.id as string,
      full_name: e.full_name as string,
      note: (e.note as string | null) ?? null,
      created_at: e.created_at as string,
      sales: enrichedProducts,
    };
  });

  // Kalau ada ?employee_id=, filter jadi 1
  const out = employeeId ? employeeList.filter((e) => e.id === employeeId) : employeeList;

  return NextResponse.json({ employees: out, total: out.length });
}

/* ============ POST ============ */

// POST /api/admin/employee-sales
// Body: {
//   employee_name: string,
//   employee_note?: string | null,
//   entries: Array<{ product_id, special_price?, purchased }>
// }
// Upsert satu karyawan (buat bila nama baru) + upsert semua entry produknya.
export async function POST(request: NextRequest) {
  const admin = await getAdminContext();
  if (isResponse(admin)) return admin;
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<EmployeeSalesPayload> & { entries?: unknown };
    const name = typeof body.employee_name === "string" ? body.employee_name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Nama karyawan wajib diisi" }, { status: 400 });
    }
    const note =
      typeof body.employee_note === "string" && body.employee_note.trim() !== ""
        ? body.employee_note.trim()
        : null;

    // 1) Cari / buat karyawan
    const { data: existing, error: findErr } = await supabaseAdmin
      .from("employees")
      .select("id, full_name")
      .ilike("full_name", name)
      .maybeSingle();
    if (findErr) {
      console.error("[API /api/admin/employee-sales] find employee error:", findErr.message);
      return NextResponse.json(
        { error: "Gagal mencari karyawan", details: findErr.message },
        { status: 500 }
      );
    }

    let employeeId: string;
    // true = karyawan baru di-insert, false = nama sudah ada (existing)
    let employeeCreated = false;
    if (existing) {
      employeeId = existing.id;
    } else {
      const { data: created, error: createErr } = await supabaseAdmin
        .from("employees")
        .insert({ full_name: name, note })
        .select()
        .single();
      if (createErr || !created) {
        console.error("[API /api/admin/employee-sales] create employee error:", createErr?.message);
        return NextResponse.json(
          { error: "Gagal membuat karyawan", details: createErr?.message },
          { status: 500 }
        );
      }
      employeeId = created.id;
      employeeCreated = true;
    }

    // 2) HPP per karyawan: HANYA ditulis bila admin benar-benar mengisi kolom
    //    HPP untuk produk itu. Disimpan di hpp_snapshot (per karyawan + produk),
    //    BUKAN ke tabel bersama product_hpp — angka Kalkulator HPP tidak
    //    terpengaruh dan tidak membengkak.
    //    null = tidak dicatat → GET memakai total live dari product_hpp.
    const entries = Array.isArray(body.entries) ? (body.entries as Array<Record<string, unknown>>) : [];
    const hppValues = Array.isArray(body.hpp_values)
      ? (body.hpp_values as Array<{ product_id?: unknown; hpp?: unknown }>)
      : [];
    const hppMap = new Map<string, number | null>();
    for (const o of hppValues) {
      const pid = typeof o.product_id === "string" ? o.product_id.trim() : "";
      if (!pid) continue;
      hppMap.set(
        pid,
        o.hpp == null || (typeof o.hpp === "string" && o.hpp === "")
          ? null
          : Math.max(0, Math.round(Number(o.hpp) || 0))
      );
    }

    // 3) Upsert massal TANPA hpp_snapshot. Produk yang kolom HPP-nya tidak
    //    disentuh admin harus mempertahankan snapshot yang sudah pernah
    //    diinput — kalau kolom ini ikut ditulis, snapshot lama terhapus.
    const upsertRows = entries.map((e) => {
      const pid = typeof e.product_id === "string" ? e.product_id.trim() : "";
      const special =
        e.special_price != null && e.special_price !== ""
          ? Math.max(0, Math.round(Number(e.special_price) || 0))
          : null;
      const purchased = e.purchased === true;
      return {
        employee_id: employeeId,
        product_id: pid,
        special_price: special ?? 0,
        purchased,
      };
    });

    if (upsertRows.length > 0) {
      const { error: upErr } = await supabaseAdmin
        .from("employee_sales")
        .upsert(upsertRows, { onConflict: "employee_id,product_id" });
      if (upErr) {
        console.error("[API /api/admin/employee-sales] upsert sales error:", upErr.message);
        return NextResponse.json(
          { error: "Gagal menyimpan penjualan", details: upErr.message },
          { status: 500 }
        );
      }
    }

    // 3b) Tulis hpp_snapshot HANYA untuk produk yang benar-benar disentuh.
    //     null di sini berarti admin mengosongkan kolom → kembali ke HPP
    //     Kalkulator (snapshot dihapus), bukan dibiarkan.
    for (const [pid, hppVal] of hppMap.entries()) {
      const { error: hppErr } = await supabaseAdmin
        .from("employee_sales")
        .update({ hpp_snapshot: hppVal })
        .eq("employee_id", employeeId)
        .eq("product_id", pid);
      if (hppErr) {
        console.error("[API /api/admin/employee-sales] update hpp error:", hppErr.message);
        return NextResponse.json(
          { error: "Gagal menyimpan HPP", details: hppErr.message },
          { status: 500 }
        );
      }
    }

    await logAdminAction({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "settings.updated",
      entity: "employee_sales",
      entityId: employeeId,
      after: { employee: name, entries_count: upsertRows.length },
    });

    return NextResponse.json({
      success: true,
      created: employeeCreated,
      employee: { id: employeeId, full_name: name },
      entries_saved: upsertRows.length,
    });
  } catch (err: unknown) {
    console.error("[API /api/admin/employee-sales] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
