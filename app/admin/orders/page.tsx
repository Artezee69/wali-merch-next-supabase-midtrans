import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logAdminAction } from "@/lib/adminAudit";
import AdminShell from "@/components/admin/AdminShell";
import OrderCard, { type OrderRow } from "@/components/admin/OrderCard";
import { AdminCard, EmptyState } from "@/components/admin/ui";
import { Filter, Search, ShoppingCart } from "lucide-react";

const ORDER_STATUS_OPTIONS = [
  "waiting_payment",
  "processing",
  "shipped",
  "completed",
  "cancelled",
];

const PAYMENT_STATUS_OPTIONS = ["pending", "paid", "failed", "expired", "refunded"];

async function updateOrderStatus(formData: FormData) {
  "use server";

  const session = await requireAdmin();

  const id = formData.get("id")?.toString();
  const orderStatus = formData.get("order_status")?.toString();
  const trackingNumber = formData.get("tracking_number")?.toString().trim() || null;
  const paymentStatus = formData.get("payment_status")?.toString();

  if (!id) throw new Error("Order ID tidak ditemukan.");

  // Read current state for audit trail.
  const { data: before } = await supabaseAdmin
    .from("orders")
    .select("order_status, payment_status, tracking_number, order_code")
    .eq("id", id)
    .maybeSingle();

  const update: Record<string, unknown> = {};
  if (orderStatus && ORDER_STATUS_OPTIONS.includes(orderStatus)) {
    update.order_status = orderStatus;
  }
  if (paymentStatus && PAYMENT_STATUS_OPTIONS.includes(paymentStatus)) {
    update.payment_status = paymentStatus;
  }
  if (formData.has("tracking_number")) {
    update.tracking_number = trackingNumber;
  }

  if (Object.keys(update).length === 0) {
    return;
  }

  const { error } = await supabaseAdmin
    .from("orders")
    .update(update)
    .eq("id", id);

  if (error) {
    console.error("UPDATE ORDER ERROR:", error);
    throw new Error(error.message);
  }

  await logAdminAction({
    actorId: session.userId,
    actorEmail: session.email,
    action: "order.updated",
    entity: "order",
    entityId: id,
    before: before ?? null,
    after: update,
  });

  revalidatePath("/admin/orders");
}

const selectCls =
  "ad-input w-full sm:w-auto !rounded-lg !py-2 text-[12.5px] font-medium";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    order_status?: string;
    payment_status?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const session = await requireAdmin();

  const params = await searchParams;
  const q = (params?.q ?? "").trim();
  const orderStatusFilter = params?.order_status ?? "all";
  const paymentStatusFilter = params?.payment_status ?? "all";
  const fromDate = params?.from ?? "";
  const toDate = params?.to ?? "";

  let query = supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(150);

  if (q) {
    query = query.or(
      `order_code.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%,customer_phone.ilike.%${q}%`
    );
  }
  if (orderStatusFilter !== "all") {
    query = query.eq("order_status", orderStatusFilter);
  }
  if (paymentStatusFilter !== "all") {
    query = query.eq("payment_status", paymentStatusFilter);
  }
  if (fromDate) {
    query = query.gte("created_at", `${fromDate}T00:00:00.000Z`);
  }
  if (toDate) {
    query = query.lte("created_at", `${toDate}T23:59:59.999Z`);
  }

  const { data: ordersRaw, error } = await query;
  const orders: OrderRow[] = (ordersRaw ?? []) as OrderRow[];

  return (
    <AdminShell
      title="Pesanan"
      subtitle="Cari, filter, dan ubah status pesanan customer"
      adminName={session.fullName}
      adminEmail={session.email}
    >
      <div className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ad-text-3)]">
          Admin / Pesanan
        </p>

        {/* Filters */}
        <AdminCard style={{ background: "linear-gradient(to right, #ffffff, #f9fafb)" }}>
          <form className="grid gap-2.5 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_1fr_1fr]">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ad-text-3)]"
              />
              <input
                name="q"
                defaultValue={q}
                placeholder="Cari ID, nama, email, HP…"
                className="ad-input !rounded-lg pl-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select name="order_status" defaultValue={orderStatusFilter} className={selectCls}>
                <option value="all">Semua Status</option>
                {ORDER_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
              <select
                name="payment_status"
                defaultValue={paymentStatusFilter}
                className={selectCls}
              >
                <option value="all">Semua Bayar</option>
                {PAYMENT_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:col-span-2 xl:col-span-1">
              <div className="grid flex-1 grid-cols-2 gap-2">
                <input
                  name="from"
                  type="date"
                  defaultValue={fromDate}
                  title="Dari tanggal"
                  className="ad-input w-full !rounded-lg !py-2 text-[12px] font-medium [color-scheme:light]"
                />
                <input
                  name="to"
                  type="date"
                  defaultValue={toDate}
                  title="Sampai tanggal"
                  className="ad-input w-full !rounded-lg !py-2 text-[12px] font-medium [color-scheme:light]"
                />
              </div>
              <button
                type="submit"
                className="ad-btn ad-btn-primary w-full !rounded-lg sm:w-auto"
              >
                <Filter size={13} /> Terapkan
              </button>
            </div>
          </form>
        </AdminCard>

        <p className="flex items-center gap-1.5 text-[12px] text-[var(--ad-text-3)]">
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--ad-accent-soft)] px-1.5 text-[11px] font-bold text-[var(--ad-accent)]">
            {orders.length}
          </span>
          pesanan ditemukan
        </p>

        {error ? (
          <div className="ad-alert ad-alert-error">
            Gagal memuat pesanan: {error.message}
          </div>
        ) : orders.length === 0 ? (
          <AdminCard>
            <EmptyState
              icon={<ShoppingCart size={20} />}
              title="Tidak ada pesanan"
              description="Coba ubah filter atau bersihkan pencarian."
            />
          </AdminCard>
        ) : (
          <div className="grid gap-3.5">
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} onUpdate={updateOrderStatus} />
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
