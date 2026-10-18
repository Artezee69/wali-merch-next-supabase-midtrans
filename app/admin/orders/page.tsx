import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logAdminAction } from "@/lib/adminAudit";
import AdminShell from "@/components/admin/AdminShell";
import OrderCard, { type OrderRow } from "@/components/admin/OrderCard";
import { ShoppingCart, Search, Filter } from "lucide-react";

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
    <AdminShell title="Pesanan" adminName={session.fullName} adminEmail={session.email}>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d7ff53]">
            Manajemen
          </p>
          <h1 className="mt-1 text-2xl font-black uppercase tracking-tight md:text-3xl">
            Pesanan
          </h1>
          <p className="mt-1 text-sm text-white/55">
            Cari, filter, dan ubah status pesanan customer.
          </p>
        </div>
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
        <form className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center">
          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari ID, nama, email, HP..."
              className="w-full rounded-full border border-white/10 bg-black/40 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#d7ff53]"
            />
          </div>
          {/* Status filter */}
          <select
            name="order_status"
            defaultValue={orderStatusFilter}
            className="w-full rounded-full border border-white/10 bg-black/40 px-3 py-2.5 text-xs font-black uppercase tracking-wider text-white outline-none focus:border-[#d7ff53] md:w-auto"
          >
            <option value="all">Semua Status</option>
            {ORDER_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
          {/* Payment filter */}
          <select
            name="payment_status"
            defaultValue={paymentStatusFilter}
            className="w-full rounded-full border border-white/10 bg-black/40 px-3 py-2.5 text-xs font-black uppercase tracking-wider text-white outline-none focus:border-[#d7ff53] md:w-auto"
          >
            <option value="all">Semua Bayar</option>
            {PAYMENT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
          {/* Date range */}
          <div className="flex gap-2">
            <input
              name="from"
              type="date"
              defaultValue={fromDate}
              className="flex-1 rounded-full border border-white/10 bg-black/40 px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-[#d7ff53] [color-scheme:dark]"
            />
            <input
              name="to"
              type="date"
              defaultValue={toDate}
              className="flex-1 rounded-full border border-white/10 bg-black/40 px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-[#d7ff53] [color-scheme:dark]"
            />
          </div>
          <button className="w-full rounded-full bg-[#d7ff53] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black transition hover:bg-white md:w-auto">
            Terapkan
          </button>
        </form>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/45">
          <Filter size={11} />
          {orders.length} pesanan ditemukan
        </div>
      </section>

      <section className="mt-6">
        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm font-bold text-red-300">
            Gagal memuat pesanan: {error.message}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-white/50">
              <ShoppingCart size={20} />
            </div>
            <h3 className="text-base font-black uppercase">Tidak ada pesanan</h3>
            <p className="mt-1 text-xs text-white/45">
              Coba ubah filter atau bersihkan pencarian.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} onUpdate={updateOrderStatus} />
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
