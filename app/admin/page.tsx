import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  Truck,
  CheckCircle2,
  Banknote,
  Plus,
} from "lucide-react";
import { requireAdmin } from "@/lib/adminAuth";
import AdminShell from "@/components/admin/AdminShell";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getStoreSettings } from "@/lib/storeSettings";
import { formatRupiah } from "@/lib/adminFormat";
import DashboardOrderRow from "@/components/admin/DashboardOrderRow";
import { EmptyState, Pill, AdminLink, type PillTone } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

type DashboardCounts = {
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  totalOrders: number;
  pendingPayment: number;
  needProcess: number;
  shipped: number;
  completed: number;
  totalCustomers: number;
  revenue: number;
};

const ORDER_FETCH_LIMIT = 50;
const ALERT_FETCH_LIMIT = 50;

async function loadDashboard(): Promise<{
  counts: DashboardCounts;
  recentOrders: any[];
  stockAlerts: any[];
  adminName: string;
  adminEmail: string;
  lowStockThreshold: number;
}> {
  const admin = await requireAdmin();
  const supabase = getSupabaseAdmin();
  const settings = await getStoreSettings();
  const threshold = settings.lowStockThreshold ?? 5;

  const [
    productsAll,
    productsActive,
    productsInactive,
    variantsLowAgg,
    ordersCount,
    ordersPending,
    ordersNeedProcess,
    ordersShipped,
    ordersCompleted,
    customersCount,
    paidOrdersRevenue,
    recentOrdersRes,
    stockAlertsRes,
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", false),
    supabase.from("product_variants").select("product_id, size, stock"),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "pending"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("order_status", "processing"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("order_status", "shipped"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("order_status", "completed"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("total_amount")
      .eq("payment_status", "paid"),
    supabase
      .from("orders")
      .select(
        "id, order_code, created_at, total_amount, payment_status, order_status, customer_name, customer_phone"
      )
      .order("created_at", { ascending: false })
      .limit(ORDER_FETCH_LIMIT),
    supabase
      .from("products")
      .select(
        "id, name, slug, is_active, product_images(image_url, sort_order), product_variants(id, size, stock)"
      )
      .order("created_at", { ascending: false })
      .limit(ALERT_FETCH_LIMIT),
  ]);

  const productsOutOfStock = await supabase
    .from("products")
    .select("id, name, slug, is_active, product_variants(id, stock), product_images(image_url, sort_order)")
    .eq("is_active", true);

  const outOfStockCount =
    (productsOutOfStock.data ?? []).filter((p: any) => {
      const variants = p.product_variants ?? [];
      return variants.length === 0 || variants.every((v: any) => (v.stock ?? 0) <= 0);
    }).length;

  // Compute variants with low stock for threshold display
  void variantsLowAgg;

  const recentOrders = (recentOrdersRes.data ?? []).map((row: any) => ({
    id: row.id,
    order_code: row.order_code,
    created_at: row.created_at,
    total_amount: row.total_amount,
    payment_status: row.payment_status,
    order_status: row.order_status,
    customer_name: row.customer_name ?? null,
    customer_phone: row.customer_phone ?? null,
  }));

  const stockAlerts = (stockAlertsRes.data ?? [])
    .map((p: any) => {
      const variants = p.product_variants ?? [];
      const totalStock = variants.reduce(
        (s: number, v: any) => s + (Number(v.stock) || 0),
        0
      );
      const lowest = variants.reduce(
        (m: number, v: any) => Math.min(m, Number(v.stock) || 0),
        Number.POSITIVE_INFINITY
      );
      const image =
        (p.product_images ?? [])
          .slice()
          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.image_url ?? null;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        is_active: p.is_active,
        image,
        totalStock: Number.isFinite(lowest) ? lowest : 0,
        variantCount: variants.length,
        hasNoVariants: variants.length === 0,
      };
    })
    .filter(
      (p: any) =>
        !p.is_active ||
        p.hasNoVariants ||
        p.totalStock <= 0 ||
        p.totalStock <= threshold
    )
    .sort((a: any, b: any) => a.totalStock - b.totalStock)
    .slice(0, 20);

  const revenue = (paidOrdersRevenue.data ?? []).reduce(
    (s: number, r: any) => s + (Number(r.total_amount) || 0),
    0
  );

  return {
    counts: {
      totalProducts: productsAll.count ?? 0,
      activeProducts: (productsActive.count ?? 0),
      outOfStockProducts:
        (productsInactive.count ?? 0) + outOfStockCount,
      totalOrders: ordersCount.count ?? 0,
      pendingPayment: ordersPending.count ?? 0,
      needProcess: ordersNeedProcess.count ?? 0,
      shipped: ordersShipped.count ?? 0,
      completed: ordersCompleted.count ?? 0,
      totalCustomers: customersCount.count ?? 0,
      revenue,
    },
    recentOrders,
    stockAlerts,
    adminName: admin.email,
    adminEmail: admin.email,
    lowStockThreshold: threshold,
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
  accent,
  trending,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warn" | "success";
  accent?: string;
  trending?: boolean;
}) {
  const toneClasses =
    tone === "warn"
      ? "border-[#fde68a] bg-[var(--ad-amber-soft)]"
      : tone === "success"
      ? "border-[#bbf7d0] bg-[var(--ad-green-soft)]"
      : "";
  const iconBg =
    tone === "warn"
      ? "bg-[#fef3c7] text-[var(--ad-amber)]"
      : tone === "success"
      ? "bg-[#dcfce7] text-[var(--ad-green)]"
      : "bg-[var(--ad-accent-soft)] text-[var(--ad-accent)]";
  return (
    <div
      className={`ad-card relative p-3.5 sm:p-5 ${toneClasses}`}
      style={accent ? { borderLeft: `4px solid ${accent}` } : undefined}
    >
      <div className="mb-2.5 flex items-center gap-2 sm:mb-3.5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${iconBg}`}>
          <Icon size={15} strokeWidth={2.2} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ad-text-3)] sm:text-[10.5px]">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xl font-bold tracking-tight text-[var(--ad-text)] sm:text-[26px]">
        {value}
        {trending && (
          <TrendingUp
            size={16}
            strokeWidth={2.4}
            className="shrink-0 text-[var(--ad-green)]"
          />
        )}
      </div>
      {hint && <div className="mt-1 text-[11px] text-[var(--ad-text-3)]">{hint}</div>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const { counts, recentOrders, stockAlerts, adminName, adminEmail, lowStockThreshold } =
    await loadDashboard();

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Ringkasan toko dan operasional harian"
      adminName={adminName}
      adminEmail={adminEmail}
    >
      <div className="space-y-5">
        {/* Hero */}
        <section
          className="flex flex-col gap-3.5 rounded-xl border border-[var(--ad-border-soft)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
          style={{ background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)" }}
        >
          <div>
            <h1 className="text-[17px] font-bold tracking-tight text-[var(--ad-text)] sm:text-[20px]">
              Halo, {adminName.split("@")[0]}
            </h1>
            <p className="mt-0.5 text-[12.5px] text-[var(--ad-text-2)]">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <AdminLink href="/admin/products/new" className="shrink-0">
            <Plus size={15} strokeWidth={2.4} className="shrink-0" />
            Tambah Produk
          </AdminLink>
        </section>

        {/* Hero metrics */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={Package}
            label="Total Produk"
            value={String(counts.totalProducts)}
            hint={`${counts.activeProducts} aktif`}
            accent="#2563eb"
            trending
          />
          <StatCard
            icon={ShoppingCart}
            label="Total Pesanan"
            value={String(counts.totalOrders)}
            hint={`${counts.pendingPayment} menunggu bayar`}
            accent="#16a34a"
            trending
          />
          <StatCard
            icon={Users}
            label="Total Customer"
            value={String(counts.totalCustomers)}
            accent="#7c3aed"
            trending
          />
          <StatCard
            icon={Banknote}
            label="Pendapatan (Paid)"
            value={formatRupiah(counts.revenue)}
            tone="success"
            accent="#d97706"
            trending
          />
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={Clock}
            label="Menunggu Pembayaran"
            value={String(counts.pendingPayment)}
            tone={counts.pendingPayment > 0 ? "warn" : "default"}
            accent="#d97706"
          />
          <StatCard
            icon={AlertTriangle}
            label="Perlu Diproses"
            value={String(counts.needProcess)}
            accent="#2563eb"
          />
          <StatCard
            icon={Truck}
            label="Sedang Dikirim"
            value={String(counts.shipped)}
            accent="#16a34a"
          />
          <StatCard
            icon={CheckCircle2}
            label="Selesai"
            value={String(counts.completed)}
            tone="success"
            accent="#7c3aed"
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {/* Recent orders */}
          <div className="ad-card overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[var(--ad-border-soft)] px-4 py-3.5 sm:px-5">
              <div>
                <h2 className="text-[14px] font-bold text-[var(--ad-text)]">
                  Pesanan Terbaru
                </h2>
                <p className="mt-0.5 text-[11.5px] text-[var(--ad-text-3)]">
                  {recentOrders.length} pesanan terakhir
                </p>
              </div>
              <Link
                href="/admin/orders"
                className="text-[12px] font-semibold text-[var(--ad-accent)] hover:underline"
              >
                Lihat semua →
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart size={20} />}
                title="Belum ada pesanan"
                description="Pesanan yang masuk akan tampil di sini."
              />
            ) : (
              <>
                {/* Mobile: card list */}
                <ul className="divide-y divide-[var(--ad-border-soft)] lg:hidden">
                  {recentOrders.map((o) => (
                    <li key={o.id} className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-[11px] font-bold text-[var(--ad-text-3)]">
                            {o.order_code || o.id.slice(0, 8)}
                          </p>
                          <p className="mt-0.5 truncate text-[13.5px] font-semibold text-[var(--ad-text)]">
                            {o.customer_name || o.customer_phone || "—"}
                          </p>
                        </div>
                        <p className="shrink-0 text-[13px] font-bold text-[var(--ad-text)]">
                          {formatRupiah(o.total_amount)}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={o.order_status} />
                        <StatusBadge status={o.payment_status} />
                        <Link
                          href="/admin/orders"
                          className="ml-auto ad-btn ad-btn-secondary ad-btn-sm !rounded-full"
                        >
                          Buka →
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
                {/* Desktop: full table */}
                <div className="hidden overflow-x-auto lg:block">
                  <table className="ad-table w-full">
                    <thead>
                      <tr className="bg-[var(--ad-surface-2)]">
                        <th>Id</th>
                        <th>Customer</th>
                        <th>Total</th>
                        <th>Pembayaran</th>
                        <th>Pesanan</th>
                        <th>Tanggal</th>
                        <th className="text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((o) => (
                        <DashboardOrderRow key={o.id} order={o} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Stock alerts */}
          <div className="ad-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--ad-border-soft)] px-4 py-3.5 sm:px-5">
              <div>
                <h2 className="flex items-center gap-2 text-[14px] font-bold text-[var(--ad-text)]">
                  <AlertTriangle size={15} strokeWidth={2.2} className="text-[var(--ad-amber)]" />
                  Peringatan Stok
                </h2>
                <p className="mt-0.5 text-[11.5px] text-[var(--ad-text-3)]">
                  Batas rendah: {lowStockThreshold} pcs
                </p>
              </div>
              <Link
                href="/admin/products"
                className="text-[12px] font-semibold text-[var(--ad-accent)] hover:underline"
              >
                Kelola →
              </Link>
            </div>
            {stockAlerts.length === 0 ? (
              <EmptyState
                icon={<TrendingUp size={20} />}
                title="Stok aman"
                description="Tidak ada produk dengan stok rendah."
              />
            ) : (
              <ul className="divide-y divide-[var(--ad-border-soft)]">
                {stockAlerts.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--ad-border)] bg-[var(--ad-surface-2)]">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package size={14} className="text-[var(--ad-text-3)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="block truncate text-[13px] font-semibold text-[var(--ad-text)] hover:text-[var(--ad-accent)]"
                      >
                        {p.name}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--ad-text-3)]">
                        <span>
                          {p.hasNoVariants
                            ? "Tanpa varian"
                            : `${p.variantCount} varian`}
                        </span>
                        <span>•</span>
                        <span
                          className={
                            p.totalStock <= 0
                              ? "font-bold text-[var(--ad-red)]"
                              : p.totalStock <= lowStockThreshold
                              ? "font-bold text-[var(--ad-amber)]"
                              : "text-[var(--ad-text-2)]"
                          }
                        >
                          {p.totalStock} pcs
                        </span>
                        {!p.is_active && (
                          <span className="ad-pill ad-pill-neutral">
                            Nonaktif
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

const DASH_STATUS_STYLES: Record<string, { label: string; tone: PillTone }> = {
  waiting_payment: { label: "Menunggu Bayar", tone: "amber" },
  processing:      { label: "Diproses",      tone: "blue" },
  shipped:         { label: "Dikirim",       tone: "blue" },
  completed:       { label: "Selesai",       tone: "green" },
  cancelled:       { label: "Dibatalkan",    tone: "red" },
  pending:         { label: "Pending",       tone: "amber" },
  paid:            { label: "Lunas",         tone: "green" },
  failed:          { label: "Gagal",         tone: "red" },
  expired:         { label: "Kadaluarsa",    tone: "neutral" },
  refunded:        { label: "Refund",        tone: "blue" },
};

function StatusBadge({ status }: { status: string }) {
  const s = DASH_STATUS_STYLES[status] ?? { label: status, tone: "neutral" as PillTone };
  return <Pill tone={s.tone}>{s.label}</Pill>;
}
