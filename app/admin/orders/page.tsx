import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { rupiah } from "@/lib/format";
import { logAdminAction } from "@/lib/adminAudit";
import AdminShell from "@/components/admin/AdminShell";
import { ShoppingCart, Search, ChevronRight, Filter } from "lucide-react";

type OrderRow = {
  id: string;
  order_code: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  total_amount: number;
  payment_status: string;
  order_status: string;
  shipping_status?: string | null;
  tracking_number?: string | null;
  created_at: string;
};

const orderStatusLabel: Record<string, string> = {
  waiting_payment: "Menunggu Bayar",
  processing: "Perlu Diproses",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const orderStatusStyle: Record<string, string> = {
  waiting_payment: "bg-yellow-400/15 text-yellow-300 border-yellow-400/30",
  processing: "bg-blue-400/15 text-blue-300 border-blue-400/30",
  shipped: "bg-purple-400/15 text-purple-300 border-purple-400/30",
  completed: "bg-[#d7ff53]/15 text-[#d7ff53] border-[#d7ff53]/30",
  cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
};

const paymentStatusLabel: Record<string, string> = {
  pending: "Pending",
  paid: "Lunas",
  failed: "Gagal",
  expired: "Kadaluarsa",
  refunded: "Refund",
};

const paymentStatusStyle: Record<string, string> = {
  pending: "bg-yellow-400/15 text-yellow-300 border-yellow-400/30",
  paid: "bg-[#d7ff53]/15 text-[#d7ff53] border-[#d7ff53]/30",
  failed: "bg-red-500/15 text-red-300 border-red-500/30",
  expired: "bg-red-500/15 text-red-300 border-red-500/30",
  refunded: "bg-purple-400/15 text-purple-300 border-purple-400/30",
};

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

  // Always stamp updated_at for traceability.
  update.updated_at = new Date().toISOString();

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
    .select(
      "id, order_code, customer_name, customer_email, customer_phone, total_amount, payment_status, order_status, tracking_number, created_at"
    )
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
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <form className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center">
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
          <select
            name="order_status"
            defaultValue={orderStatusFilter}
            className="rounded-full border border-white/10 bg-black/40 px-3 py-2.5 text-xs font-black uppercase tracking-wider text-white outline-none focus:border-[#d7ff53]"
          >
            <option value="all">Semua Status</option>
            {ORDER_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {orderStatusLabel[s]}
              </option>
            ))}
          </select>
          <select
            name="payment_status"
            defaultValue={paymentStatusFilter}
            className="rounded-full border border-white/10 bg-black/40 px-3 py-2.5 text-xs font-black uppercase tracking-wider text-white outline-none focus:border-[#d7ff53]"
          >
            <option value="all">Semua Bayar</option>
            {PAYMENT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {paymentStatusLabel[s]}
              </option>
            ))}
          </select>
          <input
            name="from"
            type="date"
            defaultValue={fromDate}
            className="rounded-full border border-white/10 bg-black/40 px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-[#d7ff53] [color-scheme:dark]"
          />
          <input
            name="to"
            type="date"
            defaultValue={toDate}
            className="rounded-full border border-white/10 bg-black/40 px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-[#d7ff53] [color-scheme:dark]"
          />
          <button className="rounded-full bg-[#d7ff53] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black transition hover:bg-white">
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

function OrderCard({
  order,
  onUpdate,
}: {
  order: OrderRow;
  onUpdate: (formData: FormData) => Promise<void>;
}) {
  return (
    <details className="group rounded-2xl border border-white/10 bg-white/[0.03] open:border-[#d7ff53]/30">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 md:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-white">{order.order_code}</span>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                orderStatusStyle[order.order_status] ||
                "border-white/10 bg-white/5 text-white/60"
              }`}
            >
              {orderStatusLabel[order.order_status] || order.order_status}
            </span>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                paymentStatusStyle[order.payment_status] ||
                "border-white/10 bg-white/5 text-white/60"
              }`}
            >
              {paymentStatusLabel[order.payment_status] || order.payment_status}
            </span>
          </div>
          <p className="mt-1 text-sm text-white/65">
            {order.customer_name}
            {order.customer_phone ? ` · ${order.customer_phone}` : ""}
          </p>
          <p className="text-[11px] text-white/40">
            {new Date(order.created_at).toLocaleString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-base font-black text-[#d7ff53] md:text-lg">
            {rupiah(order.total_amount)}
          </p>
        </div>
        <ChevronRight
          size={16}
          className="shrink-0 text-white/40 transition group-open:rotate-90"
        />
      </summary>

      <div className="border-t border-white/10 p-4 md:p-5">
        <form action={onUpdate} className="grid gap-4 lg:grid-cols-3">
          <input type="hidden" name="id" value={order.id} />

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-white/40">
              Status Pesanan
            </label>
            <select
              name="order_status"
              defaultValue={order.order_status}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-[#d7ff53]"
            >
              {ORDER_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {orderStatusLabel[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-white/40">
              Status Pembayaran
            </label>
            <select
              name="payment_status"
              defaultValue={order.payment_status}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-[#d7ff53]"
            >
              {PAYMENT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {paymentStatusLabel[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-white/40">
              Nomor Resi
            </label>
            <input
              name="tracking_number"
              defaultValue={order.tracking_number || ""}
              placeholder="JNE1234567890"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#d7ff53]"
            />
          </div>

          <div className="lg:col-span-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-white/45">
              Ubahan disimpan ke database dan dicatat di audit log admin.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/order/${order.id}`}
                target="_blank"
                className="rounded-full border border-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                Lihat di Website
              </Link>
              <button
                type="submit"
                className="rounded-full bg-[#d7ff53] px-5 py-2 text-[11px] font-black uppercase tracking-wider text-black transition hover:bg-white"
              >
                Simpan
              </button>
            </div>
          </div>
        </form>

        <div className="mt-4 grid gap-2 rounded-xl border border-white/5 bg-black/30 p-3 text-xs text-white/55 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-black uppercase text-white/40">Email</p>
            <p className="font-bold text-white/80">{order.customer_email || "-"}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-white/40">HP</p>
            <p className="font-bold text-white/80">{order.customer_phone || "-"}</p>
          </div>
        </div>
      </div>
    </details>
  );
}
