"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabasePublic } from "@/lib/supabasePublic";
import { useAuth } from "@/hooks/useAuth";
import { rupiah } from "@/lib/format";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ArrowLeft,
  Loader2,
  Package,
  ChevronRight,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type OrderItemRow = {
  product_name: string;
  size: string | null;
  price: number;
  quantity: number;
  subtotal: number;
};

type OrderRow = {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string | null;
  address: string | null;
  subtotal?: number;
  shipping_cost?: number;
  total_amount: number;
  payment_status: string;
  order_status: string;
  payment_method?: string | null;
  tracking_number?: string | null;
  created_at: string;
  order_items?: OrderItemRow[];
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  waiting_payment: "Menunggu Bayar",
  processing: "Diproses",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  paid: "Lunas",
  failed: "Gagal",
  expired: "Kadaluarsa",
  refunded: "Refund",
};

const ORDER_STATUS_STYLE: Record<string, string> = {
  waiting_payment: "bg-yellow-400/15 text-yellow-300 border-yellow-400/30",
  processing: "bg-blue-400/15 text-blue-300 border-blue-400/30",
  shipped: "bg-purple-400/15 text-purple-300 border-purple-400/30",
  completed: "bg-[#d7ff53]/15 text-[#d7ff53] border-[#d7ff53]/30",
  cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
};

function StatusBadge({
  order,
  payment,
}: {
  order: string;
  payment: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <span
        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
          ORDER_STATUS_STYLE[order] || "border-white/10 bg-white/5 text-white/60"
        }`}
      >
        {ORDER_STATUS_LABEL[order] || order}
      </span>
      <span
        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
          payment === "paid"
            ? "border-[#d7ff53]/30 bg-[#d7ff53]/10 text-[#d7ff53]"
            : payment === "pending"
            ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-300"
            : "border-red-500/30 bg-red-500/10 text-red-300"
        }`}
      >
        {PAYMENT_STATUS_LABEL[payment] || payment}
      </span>
    </div>
  );
}

export default function AccountOrdersPage() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      router.replace("/login?redirectTo=/account/orders");
      return;
    }
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session?.user?.id]);

  async function fetchOrders() {
    if (!session?.user?.id) return;
    setLoading(true);
    setError("");

    try {
      // Fetch orders linked to the current user (by user_id or phone fallback)
      const { data, error: dbError } = await supabasePublic
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (dbError) {
        // If user_id column doesn't exist yet (migration 026 not applied),
        // fall back to matching by phone number from user_metadata
        if (/column .* does not exist/i.test(dbError.message)) {
          const meta = session.user.user_metadata ?? {};
          const phone = (meta.phone as string) || session.user.email?.split("@")[0];
          if (phone) {
            const fallbackResult = await supabasePublic
              .from("orders")
              .select("*, order_items(*)")
              .eq("customer_phone", phone)
              .order("created_at", { ascending: false });

            if (fallbackResult.error) throw fallbackResult.error;
            setOrders((fallbackResult.data ?? []) as OrderRow[]);
          } else {
            setOrders([]);
          }
        } else {
          throw dbError;
        }
      } else {
        setOrders((data ?? []) as OrderRow[]);
      }
    } catch (err: any) {
      console.error("fetchOrders:", err);
      setError(err?.message || "Gagal memuat riwayat pesanan.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
          <p className="flex items-center gap-3 text-white/60">
            <Loader2 className="h-5 w-5 animate-spin" /> Memuat...
          </p>
        </main>
        <Footer />
      </>
    );
  }

  if (!session) return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-900 text-white dark:bg-[#060606]">
        {/* Header */}
        <section className="border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
          <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
            <Link
              href="/account"
              className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/50 transition hover:text-[#d7ff53]"
            >
              <ArrowLeft size={14} /> Kembali ke Akun
            </Link>
            <h1 className="text-2xl font-black uppercase tracking-tight md:text-3xl">
              Riwayat Pesanan
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Semua pesanan yang pernah kamu buat. Hanya pesanan dari akun
              kamu yang ditampilkan.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm font-bold text-red-300">
              {error}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-12">
              <p className="flex items-center gap-3 text-white/60">
                <Loader2 className="h-5 w-5 animate-spin" /> Memuat pesanan...
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-white/40">
                <Package size={22} />
              </div>
              <h3 className="text-base font-black uppercase">Belum Ada Pesanan</h3>
              <p className="mt-1 text-xs text-white/45">
                Kamu belum membuat pesanan apapun. Mulai belanja sekarang!
              </p>
              <Link
                href="/products"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#d7ff53] px-6 py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-white"
              >
                Belanja Sekarang
                <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderHistoryCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function OrderHistoryCard({ order }: { order: OrderRow }) {
  const [expanded, setExpanded] = useState(false);
  const items = order.order_items ?? [];
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const dateStr = new Date(order.created_at).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-[#d7ff53]/20">
      {/* Summary row */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full cursor-pointer items-center gap-4 px-4 py-4 text-left md:px-5"
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
            order.order_status === "completed"
              ? "bg-[#d7ff53] text-black"
              : order.order_status === "cancelled"
              ? "bg-red-500/20 text-red-300"
              : "bg-white/5 text-white/60"
          }`}
        >
          {order.order_status === "completed" ? <CheckCircle2 size={18} /> :
           order.order_status === "cancelled" ? <XCircle size={18} /> :
           <Clock size={18} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-black text-white">{order.order_code}</span>
            <StatusBadge order={order.order_status} payment={order.payment_status} />
          </div>
          <p className="mt-1 text-[11px] text-white/45">
            {dateStr} · {totalItems} item
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-black text-[#d7ff53] md:text-base">
            {rupiah(order.total_amount)}
          </p>
          {order.tracking_number && (
            <p className="mt-0.5 text-[10px] font-bold text-white/45">
              Resi: {order.tracking_number}
            </p>
          )}
        </div>

        <ChevronRight
          size={16}
          className={`shrink-0 text-white/40 transition ${expanded ? "rotate-90" : ""}`}
        />
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-white/10 px-4 py-4 md:px-5">
          {/* Items */}
          <div className="space-y-2">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-xs font-black text-white">
                    {item.product_name || "Produk"}
                  </p>
                  {item.size && (
                    <p className="text-[10px] font-bold text-white/45">{item.size}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold text-white/60">
                    ×{item.quantity}
                  </p>
                  <p className="text-xs font-black text-white">
                    {rupiah(item.subtotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Subtotal</span>
              <span className="font-bold text-white/80">
                {rupiah(order.subtotal ?? order.total_amount - (order.shipping_cost ?? 0))}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Ongkir</span>
              <span className="font-bold text-white/80">
                {order.shipping_cost && order.shipping_cost > 0
                  ? rupiah(order.shipping_cost)
                  : "Gratis"}
              </span>
            </div>
            <div className="flex justify-between pt-1 text-sm">
              <span className="font-black text-white/70">Total</span>
              <span className="font-black text-[#d7ff53]">
                {rupiah(order.total_amount)}
              </span>
            </div>
          </div>

          {/* Shipping address */}
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/5 bg-black/30 p-3">
            <MapPin size={14} className="mt-0.5 shrink-0 text-white/40" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Alamat Pengiriman
              </p>
              <p className="mt-1 text-xs leading-5 text-white/65">
                {order.customer_name} · {order.customer_phone || "-"}
                <br />
                {order.address}
              </p>
            </div>
          </div>

          {/* Track link */}
          <Link
            href={`/track-order?q=${encodeURIComponent(order.order_code)}`}
            className="mt-3 flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white/70 transition hover:border-[#d7ff53]/40 hover:text-[#d7ff53]"
          >
            Track Pesanan Ini
            <ChevronRight size={12} />
          </Link>
        </div>
      )}
    </div>
  );
}
