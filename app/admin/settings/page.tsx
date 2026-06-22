import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import AdminShell from "@/components/admin/AdminShell";
import { ShieldAlert } from "lucide-react";
import SettingsFormClient from "@/components/admin/SettingsFormClient";
import {
  DEFAULT_GENERAL,
  DEFAULT_LATEST_DROP,
} from "@/lib/storeSettings";
import type {
  StoreGeneralSettings,
  LatestDropSettings,
} from "@/lib/storeSettings";

type Row = { key: string; value: string | null };

function safeParse<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function mergeWithDefaults<T extends Record<string, unknown>>(
  parsed: Partial<T> | null,
  defaults: T
): T {
  return { ...defaults, ...(parsed ?? {}) } as T;
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const session = await requireAdmin();
  const initialTab: "store_general" | "homepage_latest_drop" =
    searchParams?.tab === "homepage_latest_drop"
      ? "homepage_latest_drop"
      : "store_general";

  // Read only the keys the form needs.
  const { data: rows, error } = await supabaseAdmin
    .from("store_settings")
    .select("key, value")
    .in("key", [
      "store_name",
      "store_whatsapp",
      "store_email",
      "store_address",
      "low_stock_threshold",
      "privacy_policy",
      "terms_of_service",
      "homepage_latest_drop",
    ]);

  if (error) {
    console.error("LOAD SETTINGS ERROR:", error.message);
  }

  const map = new Map<string, string | null>();
  ((rows ?? []) as Row[]).forEach((r) => map.set(r.key, r.value));

  // -------- General (legacy string keys) --------
  const general: StoreGeneralSettings = {
    storeName: map.get("store_name") ?? DEFAULT_GENERAL.storeName,
    storeWhatsapp: map.get("store_whatsapp") ?? "",
    storeEmail: map.get("store_email") ?? "",
    storeAddress: map.get("store_address") ?? "",
    lowStockThreshold: (() => {
      const n = Number(map.get("low_stock_threshold"));
      return Number.isFinite(n)
        ? Math.max(0, Math.min(999, Math.trunc(n)))
        : DEFAULT_GENERAL.lowStockThreshold;
    })(),
    privacyPolicy: map.get("privacy_policy") ?? "",
    termsOfService: map.get("terms_of_service") ?? "",
  };

  // -------- Latest Drop (homepage section) --------
  const latestDrop: LatestDropSettings = mergeWithDefaults(
    safeParse<Partial<LatestDropSettings>>(map.get("homepage_latest_drop")),
    {
      ...DEFAULT_LATEST_DROP,
      manualProductIds: [...DEFAULT_LATEST_DROP.manualProductIds],
    }
  );

  // -------- Products (for Latest Drop "manual" mode) --------
  const { data: productsData } = await supabaseAdmin
    .from("products")
    .select("id, name")
    .order("created_at", { ascending: false })
    .limit(100);
  const products = (productsData ?? []).map((p: any) => ({
    id: p.id as string,
    name: (p.name as string) ?? "Tanpa nama",
  }));

  const initial = {
    store_general: general,
    homepage_latest_drop: latestDrop,
  };

  return (
    <AdminShell
      title="Pengaturan"
      adminName={session.fullName}
      adminEmail={session.email}
    >
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d7ff53]">
            Manajemen
          </p>
          <h1 className="mt-1 text-2xl font-black uppercase tracking-tight md:text-3xl">
            Pengaturan
          </h1>
          <p className="mt-1 text-sm text-white/55">
            Identitas toko dan konten section Latest Drop di homepage — semua
            dapat diedit di sini. Perubahan tersimpan ke tabel{" "}
            <code className="text-white/70">store_settings</code>.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-yellow-200">
        <div className="flex items-start gap-2">
          <ShieldAlert size={14} className="mt-0.5 shrink-0" />
          <p>
            <strong>Peringatan:</strong> secret seperti Supabase service role,
            Midtrans server key, dan database password tetap disimpan di
            environment variable server dan tidak dapat diubah dari halaman ini.
          </p>
        </div>
      </div>

      <SettingsFormClient initial={initial} products={products} initialTab={initialTab} />
    </AdminShell>
  );
}