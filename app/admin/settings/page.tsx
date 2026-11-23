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

type BankSettings = {
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
};

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
      "bank_name",
      "bank_account_number",
      "bank_account_holder",
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
    bank: {
      bankName: map.get("bank_name") ?? "",
      bankAccountNumber: map.get("bank_account_number") ?? "",
      bankAccountHolder: map.get("bank_account_holder") ?? "",
    } as BankSettings,
  };

  return (
    <AdminShell
      title="Pengaturan"
      adminName={session.fullName}
      adminEmail={session.email}
    >
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--ad-text)]">
            Pengaturan
          </h1>
          <p className="mt-1 text-[13px] text-[var(--ad-text-3)]">
            Identitas toko, section Latest Drop, dan data pembayaran — semua
            dapat diedit di sini. Perubahan tersimpan ke tabel{" "}
            <code className="rounded bg-[var(--ad-surface-2)] px-1 py-0.5 font-mono text-[11px] text-[var(--ad-accent)]">store_settings</code>.
          </p>
        </div>
      </div>

      <div className="ad-alert ad-alert-warn mb-5">
        <ShieldAlert size={15} className="mt-0.5 shrink-0" />
        <p className="text-[12.5px] leading-5">
          <strong>Peringatan:</strong> secret seperti Supabase service role,
          Midtrans server key, dan database password tetap disimpan di
          environment variable server dan tidak dapat diubah dari halaman ini.
        </p>
      </div>

      <SettingsFormClient
        initial={initial as { store_general: StoreGeneralSettings; homepage_latest_drop: LatestDropSettings; bank: { bankName: string; bankAccountNumber: string; bankAccountHolder: string } }}
        products={products}
        initialTab={initialTab as "store_general" | "homepage_latest_drop" | "bank"}
      />
    </AdminShell>
  );
}