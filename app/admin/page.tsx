import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Banknote,
} from "lucide-react";
import { requireAdmin } from "@/lib/adminAuth";
import AdminShell from "@/components/admin/AdminShell";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getStoreSettings } from "@/lib/storeSettings";
import {
  formatRupiah,
  formatShortDate,
  formatPaymentStatus,
  formatOrderStatus,
} from "@/lib/adminFormat";
import DashboardOrderRow from "@/components/admin/DashboardOrderRow";

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
      .in("fulfillment_status", ["menunggu_pembayaran", "perlu_diproses", "sedang_dikemas"])
      .neq("payment_status", "cancelled"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("fulfillment_status", "dikirim"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("fulfillment_status", "selesai"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer"),
    supabase
      .from("orders")
      .select("total")
      .eq("payment_status", "paid"),
    supabase
      .from("orders")
      .select(
        "id, order_number, created_at, total, payment_status, fulfillment_status, profiles(full_name, email)"
      )
      .order("created_at", { ascending: false })
      .limit(ORDER_FETCH_LIMIT),
    supabase
      .from("products")
      .select(
        "id, name, slug, is_active, product_images(url, position), product_variants(id, size, stock)"
      )
      .order("created_at", { ascending: false })
      .limit(ALERT_FETCH_LIMIT),
  ]);

  const productsOutOfStock = await supabase
    .from("products")
    .select("id, name, slug, is_active, product_variants(id, stock), product_images(url, position)")
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
    order_number: row.order_number,
    created_at: row.created_at,
    total: row.total,
    payment_status: row.payment_status,
    fulfillment_status: row.fulfillment_status,
    customer_name: row.profiles?.full_name ?? null,
    customer_email: row.profiles?.email ?? null,
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
          .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))[0]?.url ?? null;
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
    (s: number, r: any) => s + (Number(r.total) || 0),
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
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warn" | "success";
}) {
  const toneClasses =
    tone === "warn"
      ? "border-amber-500/30 bg-amber-500/5 text-amber-300"
      : tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
      : "border-white/10 bg-white/[0.04] text-white";
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${toneClasses}`}>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <Icon size={16} strokeWidth={2.2} className="text-[#d7ff53]" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
          {label}
        </span>
      </div>
      <div className="text-2xl font-black tracking-tight sm:text-3xl">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-white/50">{hint}</div>}
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
      <div className="space-y-6">
        {/* Hero metrics */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Package}
            label="Total Produk"
            value={String(counts.totalProducts)}
            hint={`${counts.activeProducts} aktif`}
          />
          <StatCard
            icon={ShoppingCart}
            label="Total Pesanan"
            value={String(counts.totalOrders)}
            hint={`${counts.pendingPayment} menunggu bayar`}
          />
          <StatCard
            icon={Users}
            label="Total Customer"
            value={String(counts.totalCustomers)}
          />
          <StatCard
            icon={Banknote}
            label="Pendapatan (Paid)"
            value={formatRupiah(counts.revenue)}
            tone="success"
          />
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Clock}
            label="Menunggu Pembayaran"
            value={String(counts.pendingPayment)}
            tone={counts.pendingPayment > 0 ? "warn" : "default"}
          />
          <StatCard
            icon={AlertTriangle}
            label="Perlu Diproses"
            value={String(counts.needProcess)}
          />
          <StatCard
            icon={Truck}
            label="Sedang Dikirim"
            value={String(counts.shipped)}
          />
          <StatCard
            icon={CheckCircle2}
            label="Selesai"
            value={String(counts.completed)}
            tone="success"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {/* Recent orders */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] lg:col-span-2">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-white/80">
                  Pesanan Terbaru
                </h2>
                <p className="mt-0.5 text-xs text-white/50">
                  {recentOrders.length} pesanan terakhir
                </p>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-bold text-[#d7ff53] hover:underline"
              >
                Lihat semua →
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="Belum ada pesanan"
                description="Pesanan yang masuk akan tampil di sini."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
                      <th className="px-5 py-3">ID</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Total</th>
                      <th className="px-5 py-3">Pembayaran</th>
                      <th className="px-5 py-3">Pesanan</th>
                      <th className="px-5 py-3">Tanggal</th>
                      <th className="px-5 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <DashboardOrderRow
                        key={o.id}
                        order={o}
                        formatPaymentStatus={formatPaymentStatus}
                        formatOrderStatus={formatOrderStatus}
                        formatRupiah={formatRupiah}
                        formatShortDate={formatShortDate}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Stock alerts */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white/80">
                  <AlertTriangle size={14} strokeWidth={2.5} className="text-amber-400" />
                  Peringatan Stok
                </h2>
                <p className="mt-0.5 text-xs text-white/50">
                  Batas rendah: {lowStockThreshold} pcs
                </p>
              </div>
              <Link
                href="/admin/products"
                className="text-xs font-bold text-[#d7ff53] hover:underline"
              >
                Kelola →
              </Link>
            </div>
            {stockAlerts.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="Stok aman"
                description="Tidak ada produk dengan stok rendah."
              />
            ) : (
              <ul className="divide-y divide-white/5">
                {stockAlerts.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package size={14} className="text-white/40" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="block truncate text-sm font-bold text-white hover:text-[#d7ff53]"
                      >
                        {p.name}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/50">
                        <span>
                          {p.hasNoVariants
                            ? "Tanpa varian"
                            : `${p.variantCount} varian`}
                        </span>
                        <span>•</span>
                        <span
                          className={
                            p.totalStock <= 0
                              ? "font-bold text-red-300"
                              : p.totalStock <= lowStockThreshold
                              ? "font-bold text-amber-300"
                              : "text-white/60"
                          }
                        >
                          {p.totalStock} pcs
                        </span>
                        {!p.is_active && (
                          <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white/60">
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

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50">
        <Icon size={18} strokeWidth={2.2} />
      </div>
      <p className="text-sm font-bold text-white/80">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-white/50">{description}</p>
    </div>
  );
}
